import subprocess
import tempfile
from pathlib import Path


def stitch_audio_files(file_paths: list[str], output_format: str = "mp3") -> bytes:
    with tempfile.TemporaryDirectory() as tmpdir:
        list_path = Path(tmpdir) / "files.txt"
        output_path = Path(tmpdir) / f"output.{output_format}"

        with open(list_path, "w") as f:
            for fp in file_paths:
                f.write(f"file '{fp}'\n")

        subprocess.run(
            ["ffmpeg", "-f", "concat", "-safe", "0", "-i", str(list_path), "-c", "copy", str(output_path)],
            check=True,
            capture_output=True,
        )
        return output_path.read_bytes()


def convert_audio(input_bytes: bytes, input_format: str, output_format: str) -> bytes:
    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = Path(tmpdir) / f"input.{input_format}"
        output_path = Path(tmpdir) / f"output.{output_format}"
        input_path.write_bytes(input_bytes)

        subprocess.run(
            ["ffmpeg", "-i", str(input_path), str(output_path)],
            check=True,
            capture_output=True,
        )
        return output_path.read_bytes()
