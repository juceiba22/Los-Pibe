# Use the official MediaMTX image with ffmpeg pre-installed
# The -ffmpeg tag bundles ffmpeg so we don't need a multi-stage build
FROM bluenviron/mediamtx:latest-ffmpeg

# Copy our custom config over the default one
# MediaMTX looks for mediamtx.yml in the working directory (/),
# or at the path passed as the first argument to the binary.
COPY mediamtx.yml /mediamtx.yml

# The base image already sets the correct ENTRYPOINT and CMD.
# MediaMTX will load /mediamtx.yml automatically.
