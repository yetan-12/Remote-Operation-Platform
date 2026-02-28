# Testing Connection Backend

**Standalone** — no `gello_software` dependency. All required logic is in `lib/`.

- **Robot**: ZMQ REQ socket, pickle protocol (`num_dofs` / `get_observations`). Connects to quick_run-style robot server.
- **GELLO**: Dynamixel serial at 57600. USB port e.g. `COM3` (Windows) or `/dev/ttyUSB0` (Linux).

## Run (standalone)

```bash
cd testing-connection/backend
pip install -r requirements.txt
python main.py
```

Server: `http://localhost:8000`. Frontend at project root: `npm run dev` then open the test page.

## Endpoints

- `POST /api/test/robot` — body `{ "host": "127.0.0.1", "port": 6001 }` → ZMQ num_dofs.
- `GET /api/test/robot/state?host=&port=` — get_observations for state params.
- `GET /api/test/gello/ports` — list available serial ports (auto-detect for GELLO).
- `POST /api/test/gello` — body `{ "port": "COM3" }` → open serial at 57600, close.
- `GET /api/test/gello/state?port=COM3` — read GELLO (Dynamixel) joint positions in radians (IDs 1–7); requires `dynamixel-sdk`.
