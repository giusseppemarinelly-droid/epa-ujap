import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

type InputProps = TextInputProps & {
  label?: string;
};

export function Input({ label, style, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text
          className="text-on-surface-variant mb-2"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.6 }}
        >
          {label}
        </Text>
      )}
      <TextInput
        className="rounded-md px-4 py-3 text-on-surface"
        style={[
          {
            backgroundColor: '#EAEAEA',
            borderWidth: 2,
            borderColor: focused ? '#FF6F61' : 'transparent',
            fontFamily: 'Inter_400Regular',
            fontSize: 16,
          },
          style,
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor="#8C716D"
        {...props}
      />
    </View>
  );
}
