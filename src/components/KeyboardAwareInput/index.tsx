// components/KeyboardAwareInput.tsx
import React from 'react'
import {
  Keyboard,
  Platform,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from 'react-native'
import { Input as NativeBaseInput, IInputProps, FormControl } from 'native-base'

type Props = IInputProps & {
  errorMessage?: string | null
  nextRef?: React.RefObject<any>
}

export function Input({
  errorMessage,
  nextRef,
  onSubmitEditing,
  ...rest
}: Props) {
  const handleSubmit = (
    e: NativeSyntheticEvent<TextInputSubmitEditingEventData>,
  ) => {
    if (nextRef) {
      nextRef.current?.focus()
    } else {
      Keyboard.dismiss()
    }
    onSubmitEditing?.(e) // Passa o evento para o callback
  }

  return (
    <FormControl isInvalid={!!errorMessage} mb={4}>
      <NativeBaseInput
        variant="underlined"
        bg="gray.50"
        h={12}
        px={4}
        fontSize="md"
        returnKeyType={nextRef ? 'next' : 'done'}
        blurOnSubmit={!nextRef}
        onSubmitEditing={handleSubmit} // Agora recebe o evento corretamente
        placeholderTextColor="gray.400"
        _focus={{
          bg: 'gray.50',
          borderColor: 'green.700',
        }}
        {...rest}
      />
      <FormControl.ErrorMessage>{errorMessage}</FormControl.ErrorMessage>
    </FormControl>
  )
}
