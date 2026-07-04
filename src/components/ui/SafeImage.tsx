import React from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';

interface SafeImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  blurRadius?: number;
  fallback?: React.ReactNode;
}

// Wraps Image to avoid "source.uri = ''" warnings — renders fallback or empty View when uri is falsy/empty.
export function SafeImage({
  uri,
  style,
  containerStyle,
  resizeMode = 'cover',
  blurRadius,
  fallback,
}: SafeImageProps) {
  if (!uri || uri.trim() === '') {
    if (fallback) return <View style={containerStyle}>{fallback}</View>;
    return <View style={[style as any, containerStyle]} />;
  }
  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      blurRadius={blurRadius}
    />
  );
}
