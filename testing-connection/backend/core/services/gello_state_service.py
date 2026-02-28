"""
Gello State Service: read joint positions from GELLO (Dynamixel).
Decoupled from API; used for /api/test/gello/state and /api/test/gello/scan.
"""


def _read_single_servo_p2(port_handler, packet_handler, dxl_id: int, addr: int = 132):
    from dynamixel_sdk.robotis_def import COMM_SUCCESS
    dxl_present_pos, dxl_comm_result, _ = packet_handler.read4ByteTxRx(
        port_handler, dxl_id, addr
    )
    if dxl_comm_result != COMM_SUCCESS:
        err_str = getattr(packet_handler, "getTxRxResult", lambda _: str(_))(dxl_comm_result)
        return None, f"ID {dxl_id}: {err_str}"
    raw = dxl_present_pos
    if raw > 0x7FFFFFFF:
        raw -= 0x100000000
    return raw / 2048.0 * 3.141592653589793, None


def read_gello_joints(
    port: str,
    baudrate: int = 57600,
    joint_ids: tuple = (1, 2, 3, 4, 5, 6, 7),
) -> tuple:
    """Read present position (rad) for given Dynamixel IDs. Returns (joints, error)."""
    try:
        from dynamixel_sdk.port_handler import PortHandler
        from dynamixel_sdk.packet_handler import PacketHandler
        from dynamixel_sdk.group_sync_read import GroupSyncRead
        from dynamixel_sdk.robotis_def import COMM_SUCCESS
    except ImportError as e:
        return [], f"dynamixel-sdk 未安装: {e}"
    ADDR_PRESENT_POSITION = 132
    LEN_PRESENT_POSITION = 4
    ph = PortHandler(port)
    pk = PacketHandler(2.0)
    last_err = ""
    try:
        if not ph.openPort():
            return [], f"无法打开串口 {port}"
        if not ph.setBaudRate(baudrate):
            ph.closePort()
            return [], "设置波特率失败"
        for try_ids in (joint_ids, (1, 2, 3, 4, 5, 6)):
            group_read = GroupSyncRead(ph, pk, ADDR_PRESENT_POSITION, LEN_PRESENT_POSITION)
            for did in try_ids:
                if not group_read.addParam(did):
                    break
            else:
                result = group_read.txRxPacket()
                if result == COMM_SUCCESS:
                    joints = []
                    for did in try_ids:
                        if group_read.isAvailable(did, ADDR_PRESENT_POSITION, LEN_PRESENT_POSITION):
                            raw = group_read.getData(did, ADDR_PRESENT_POSITION, LEN_PRESENT_POSITION)
                            if raw > 0x7FFFFFFF:
                                raw -= 0x100000000
                            joints.append(raw / 2048.0 * 3.141592653589793)
                        else:
                            joints.append(0.0)
                    while len(joints) < 7:
                        joints.append(0.0)
                    ph.closePort()
                    return joints, None
                last_err = getattr(pk, "getTxRxResult", lambda _: str(_))(result) if hasattr(pk, "getTxRxResult") else "txRxPacket failed"
        for try_ids in (joint_ids, (1, 2, 3, 4, 5, 6)):
            joints = []
            ok = True
            for did in try_ids:
                val, err = _read_single_servo_p2(ph, pk, did, ADDR_PRESENT_POSITION)
                if err:
                    last_err = err
                    ok = False
                    break
                joints.append(val)
            if ok and joints:
                while len(joints) < 7:
                    joints.append(0.0)
                ph.closePort()
                return joints, None
        ph.closePort()
        return [], f"读取失败（{last_err}）"
    except Exception as e:
        try:
            ph.closePort()
        except Exception:
            pass
        return [], str(e)


def scan_gello_ids(port: str, baudrate: int = 57600) -> dict:
    """Ping IDs 1-12 to find responding servos."""
    try:
        from dynamixel_sdk.port_handler import PortHandler
        from dynamixel_sdk.packet_handler import PacketHandler
        from dynamixel_sdk.robotis_def import COMM_SUCCESS
    except ImportError:
        return {"ok": False, "ids": [], "error": "dynamixel-sdk 未安装"}
    ph = PortHandler(port)
    pk = PacketHandler(2.0)
    try:
        if not ph.openPort():
            return {"ok": False, "ids": [], "error": f"无法打开串口 {port}"}
        if not ph.setBaudRate(baudrate):
            ph.closePort()
            return {"ok": False, "ids": [], "error": "设置波特率失败"}
        found = [i for i in range(1, 13) if pk.ping(ph, i)[1] == COMM_SUCCESS]
        ph.closePort()
        return {"ok": True, "ids": found}
    except Exception as e:
        try:
            ph.closePort()
        except Exception:
            pass
        return {"ok": False, "ids": [], "error": str(e)}


def parse_ids_param(ids: str) -> tuple | None:
    """Parse ids query: '1-7' -> (1,2,...,7), 'auto' -> None."""
    if not ids or str(ids).strip().lower() == "auto":
        return None
    s = str(ids).strip()
    if s == "1-7":
        return (1, 2, 3, 4, 5, 6, 7)
    if s == "1-6":
        return (1, 2, 3, 4, 5, 6)
    if "," in s:
        try:
            return tuple(int(x.strip()) for x in s.split(",") if x.strip())
        except ValueError:
            return None
    return None
