import Image from "next/image";
import { PLACEHOLDER_IMAGE } from "@/lib/utils";

interface ProductMediaFrameProps {
  src?: string | null;
  alt: string;
  variant?: "card" | "horizontal" | "thumb";
  priority?: boolean;
}

const sizeMap = {
  card: "(max-width: 768px) 50vw, 33vw",
  horizontal: "220px",
  thumb: "64px",
} as const;

export function ProductMediaFrame({
  src,
  alt,
  variant = "card",
  priority = false,
}: ProductMediaFrameProps) {
  return (
    <div className={`product-media-frame product-media-frame--${variant}`}>
      <Image
        src={src || PLACEHOLDER_IMAGE}
        alt={alt}
        fill
        priority={priority}
        sizes={sizeMap[variant]}
        className="product-media-img"
      />
    </div>
  );
}
