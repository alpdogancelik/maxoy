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
    className,
    style: commonStyle,
    ...rest,
  };

  if (isDataUrl(imageSrc) || isSvg(imageSrc)) {
    return (
      // Data URLs and SVGs can bypass Next image optimization safely here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        width={width}
        height={height}
        className={className}
        style={commonStyle}
        {...rest}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
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
      alt={alt}
      width={width || 400}
      height={height || 400}
      sizes={sizes}
      priority={priority}
      {...commonProps}
    />
  );
};

export default SmartImage;
