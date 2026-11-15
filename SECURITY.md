# Security and privacy

TrapScholar has **no backend, cloud telemetry, hosted inference, cookies for third parties or user accounts**. Game progress is saved in this browser's `localStorage` under `trapscholar-v2`. Old `trapscholar-v1` saves are read for non-destructive migration.

The JSON importer enforces a **2 MiB file-size limit**, validates the expected save format and rejects invalid trap cells. Event text is rendered using safe DOM text insertion. A malicious file may still stress resource usage in the browser; do not import untrusted saves unless necessary.

Sound uses the built-in Web Audio API only after user activation. Audio files and microphone permissions are not used. Game exports are saved locally using a Blob URL.

For vulnerability reports, open a GitHub Security Advisory or contact the repository maintainer through GitHub. Avoid publicly publishing details that could affect others before the issue has been reviewed.
