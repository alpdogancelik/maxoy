import React from "react";
import Image from "next/image";

interface SmartImageProps {
  src?: string;
  assetId?: string;
  alt?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const isDataUrl = (src: string) => src.startsWith("data:");
const isSvg = (src: string) => src.endsWith(".svg");

const SmartImage: React.FC<SmartImageProps> = ({
  src,
  assetId,
  alt = "",
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  className,
  style,
  ...rest
}) => {
  const imageSrc = src || (assetId ? `/placeholder-${assetId}.jpg` : "/placeholder-product.png");
  
  if (!imageSrc) return null;

  const commonStyle = fill ? { width: "100%", height: "100%", ...style } : style;
  const commonProps = {
    alt,
    className,
    style: commonStyle,
    ...rest,
  };

  if (isDataUrl(imageSrc) || isSvg(imageSrc)) {
    return (
      <img
        src={imageSrc}
        loading={priority ? "eager" : "lazy"}
        width={width}
        height={height}
        {...commonProps}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={imageSrc}
        fill
        sizes={sizes || "100vw"}
        priority={priority}
        {...commonProps}
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      width={width || 400}
      height={height || 400}
      sizes={sizes}
      priority={priority}
      {...commonProps}
    />
  );
};

export default SmartImage;
