import React, { forwardRef } from 'react'
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons' // ou qualquer ícone que você use

type InputProps = {
  label?: string
  icon?: React.ReactNode
  leftIcon?: JSX.Element
  rightIcon?: JSX.Element

  value: string
  onChangeText: (text: string) => void
  placeholder: string
  secureTextEntry?: boolean
  errorMessage?: string
  onFocus?: () => void
  keyboardType?:
    | 'default'
    | 'email-address'
    | 'numeric'
    | 'phone-pad'
    | 'decimal-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send'
  onSubmitEditing?: () => void
} & React.ComponentProps<typeof TextInput>

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      value,
      onChangeText,
      placeholder,
      secureTextEntry = false,
      errorMessage,
      onFocus,
      keyboardType = 'default',
      autoCapitalize = 'sentences',
      returnKeyType = 'done',
      onSubmitEditing,
      leftIcon,
      rightIcon,
    },
    ref,
  ) => {
    return (
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[styles.input, errorMessage ? styles.inputError : {}]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            secureTextEntry={secureTextEntry}
            onFocus={onFocus}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
          />
          {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
        </View>
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>
    )
  },
)

Input.displayName = 'Input'

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row', // Garantir que os ícones e o input fiquem na mesma linha
    alignItems: 'center', // Alinhar o conteúdo verticalmente
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    height: 40,
  },
  input: {
    flex: 1, // O campo de texto ocupa o espaço restante
    paddingLeft: 10,
  },
  iconContainer: {
    marginLeft: 10, // Adiciona espaçamento ao redor do ícone
    marginRight: 10,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
})
