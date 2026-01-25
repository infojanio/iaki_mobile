import { Text, Pressable, IPressableProps, Box } from 'native-base'
import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

type Props = IPressableProps & {
  name: string
  subcategory: string
  isActive: boolean
}

export function SubcategoryCard({ name, isActive, ...rest }: Props) {
  const underlineAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(underlineAnim, {
      toValue: isActive ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start()
  }, [isActive])

  const underlineWidth = underlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  const underlineOpacity = underlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  return (
    <Pressable
      px={3}
      py={2}
      mr={3}
      alignItems="center"
      justifyContent="center"
      _pressed={{ opacity: 0.7 }}
      {...rest}
    >
      <Text
        fontSize="xs"
        textTransform="uppercase"
        fontWeight={isActive ? 'bold' : 'medium'}
        color={isActive ? 'green.600' : 'coolGray.600'}
      >
        {name}
      </Text>

      {/* 🔥 Underline animado */}
      <Box mt={1} height="2px" width="100%">
        <Animated.View
          style={{
            height: 2,
            width: underlineWidth,
            opacity: underlineOpacity,
            backgroundColor: '#16a34a', // green.600
            borderRadius: 2,
          }}
        />
      </Box>
    </Pressable>
  )
}
