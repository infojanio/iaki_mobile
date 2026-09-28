import React, { forwardRef, ReactNode, useState } from 'react'

import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'

type InputProps = TextInputProps & {
  label?: string

  leftIcon?: ReactNode

  rightIcon?: ReactNode

  errorMessage?: string | null
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      leftIcon,
      rightIcon,
      errorMessage,
      style,
      placeholderTextColor = '#6B7280',
      editable = true,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false)

    function handleFocus(event: any) {
      setIsFocused(true)

      onFocus?.(event)
    }

    function handleBlur(event: any) {
      setIsFocused(false)

      onBlur?.(event)
    }

    const hasError = Boolean(errorMessage)

    return (
      <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}

        <View
          style={[
            styles.inputContainer,

            isFocused && !hasError && styles.inputContainerFocused,

            hasError && styles.inputContainerError,

            !editable && styles.inputContainerDisabled,
          ]}
        >
          {leftIcon ? (
            <View style={styles.leftIconContainer}>{leftIcon}</View>
          ) : null}

          <TextInput
            ref={ref}
            style={[styles.input, style]}
            editable={editable}
            placeholderTextColor={placeholderTextColor}
            onFocus={handleFocus}
            onBlur={handleBlur}
            selectionColor="#2563EB"
            {...rest}
          />

          {rightIcon ? (
            <View style={styles.rightIconContainer}>{rightIcon}</View>
          ) : null}
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
      </View>
    )
  },
)

Input.displayName = 'Input'

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  label: {
    marginLeft: 2,

    marginBottom: 7,

    fontSize: 13,

    lineHeight: 18,

    fontWeight: '600',

    color: '#374151',
  },

  inputContainer: {
    minHeight: 52,

    paddingHorizontal: 14,

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#D1D5DB',

    borderRadius: 13,

    backgroundColor: '#FFFFFF',
  },

  inputContainerFocused: {
    borderColor: '#2563EB',

    borderWidth: 1.5,
  },

  inputContainerError: {
    borderColor: '#DC2626',
  },

  inputContainerDisabled: {
    opacity: 0.65,

    backgroundColor: '#F3F4F6',
  },

  input: {
    flex: 1,

    minWidth: 0,

    minHeight: 50,

    paddingVertical: 0,

    paddingHorizontal: 0,

    fontSize: 15,

    color: '#111827',

    textAlignVertical: 'center',
  },

  leftIconContainer: {
    marginRight: 10,

    alignItems: 'center',

    justifyContent: 'center',
  },

  rightIconContainer: {
    marginLeft: 8,

    alignItems: 'center',

    justifyContent: 'center',
  },

  errorText: {
    marginTop: 5,

    marginLeft: 3,

    fontSize: 12,

    lineHeight: 16,

    color: '#DC2626',
  },
})
