import React from 'react'
import { TouchableOpacity } from 'react-native'
import {
  Box,
  HStack,
  VStack,
  Text,
  Center,
  Image,
  Icon,
  useTheme,
  Divider,
  Avatar,
} from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import MarketPng from '@assets/novoLogo.png'
import { useAuth } from '@hooks/useAuth'

import { useCart } from '@hooks/useCart'

import { LocationSelector } from '@components/LocationSelector'

export function HomeHeader() {
  const { user, signOut } = useAuth()

  const { colors, sizes } = useTheme()

  //função para deslogar
  const handleLogout = async () => {
    try {
      await signOut() // 🔐 faz logout depois
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }

  return (
    <VStack safeArea>
      <Box
        bg={'blue.700'}
        px={4}
        pb={4}
        ml={1}
        mr={1}
        borderTopRadius={'3xl'}
        borderBottomWidth={1.0}
        borderBottomColor="gray.400"
        shadow={3}
      >
        {/* Primeira Linha - Saudação e Botão Sair */}
        <HStack
          justifyContent="space-between"
          alignItems="center"
          mt={2}
          mb={2}
        >
          <Avatar
            bg="blue.400"
            size="md"
            source={{
              uri:
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${user?.name}`,
            }}
          ></Avatar>
          <VStack mr={16}>
            <Text fontSize="md" color="white" fontWeight="medium" opacity={0.9}>
              Olá,
            </Text>
            <Text
              fontSize="14"
              color="white"
              fontWeight="bold"
              numberOfLines={1}
              maxW="180"
              textTransform="capitalize"
            >
              {user.name}
            </Text>
          </VStack>

          <TouchableOpacity onPress={handleLogout}>
            <HStack
              bg="rgba(255,255,255,0.15)"
              px={6}
              py={2}
              borderRadius="full"
              alignItems="center"
              space={2}
            >
              <Icon as={MaterialIcons} name="logout" color="white" size={4} />

              <Text color="white" fontWeight="600" fontSize="12">
                Sair
              </Text>
            </HStack>
          </TouchableOpacity>
        </HStack>

        {/* Segunda Linha - Saldo e Logo */}
        {/* LOCALIZAÇÃO + LOGO */}
        <HStack mt={2} justifyContent="space-between" alignItems="center">
          <Box
            flex={1}
            bg="white"
            borderRadius={20}
            px={1}
            py={1}
            mb={4}
            mr={16}
            shadow={2}
          >
            <LocationSelector />
          </Box>

          <HStack>
            <Box mb={2}>
              <Image
                alt="Logo"
                source={MarketPng}
                h={16}
                w={66}
                borderRadius={16}
                resizeMode="cover"
              />
            </Box>
          </HStack>
        </HStack>
      </Box>
    </VStack>
  )
}
