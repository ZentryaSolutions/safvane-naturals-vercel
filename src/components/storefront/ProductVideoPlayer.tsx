"use client";

type ProductVideoPlayerProps = {
  src: string;
  poster?: string | null;
  className?: string;
  controls?: boolean;
  muted?: boolean;
  preload?: "none" | "metadata" | "auto";
  "aria-hidden"?: boolean | "true" | "false";
};

/** iOS Safari needs playsInline + webkit-playsinline for in-page playback. */
export function ProductVideoPlayer({
  src,
  poster,
  className,
  controls = false,
  muted = false,
  preload = "metadata",
  ...rest
}: ProductVideoPlayerProps) {
  return (
    <video
      className={className}
      src={src}
      poster={poster ?? undefined}
      controls={controls}
      muted={muted}
      playsInline
      preload={preload}
      controlsList={controls ? "nodownload" : undefined}
      {...rest}
      // Legacy Safari attribute (React does not type it)
      {...{ "webkit-playsinline": "true", "x-webkit-airplay": "allow" }}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support video playback.
    </video>
  );
}
