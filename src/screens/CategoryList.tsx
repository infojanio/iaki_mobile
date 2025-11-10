import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshControl, FlatList as RNFlatList } from 'react-native'
import {
  VStack,
  Box,
  Text,
  Pressable,
  Icon,
  useToast,
  Image,
  Center,
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { Image as ImageIcon } from 'lucide-react-native'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'
import { Loading } from '@components/Loading'

import { CategoryDTO } from '@dtos/CategoryDTO'
import { SubCategoryDTO } from '@dtos/SubCategoryDTO'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

type Props = {
  /** defina true quando esta lista estiver DENTRO de um ScrollView pai */
  insideScrollView?: boolean
}

export function CategoryList({ insideScrollView = true }: Props) {
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const toast = useToast()

  function getCategoryIdFromSub(s: SubCategoryDTO): string | null {
    // cobre variações comuns do backend
    // @ts-ignore
    return s.category_id ?? s.categoryId ?? s.category?.id ?? null
  }

  async function loadAll(showLoader = true) {
    try {
      if (showLoader) setIsLoading(true)

      const [catRes, subRes] = await Promise.all([
        api.get('/categories'),
        api.get('/subcategories'),
      ])

      const cats: CategoryDTO[] = catRes.data ?? []
      const subs: SubCategoryDTO[] = subRes.data ?? []

      const byCategory: Record<string, SubCategoryDTO[]> = {}
      for (const s of subs) {
        const cid = getCategoryIdFromSub(s)
        if (!cid) continue
        if (!byCategory[cid]) byCategory[cid] = []
        byCategory[cid].push(s)
      }

      const merged: CategoryDTO[] = cats.map((c) => ({
        ...c,
        // @ts-ignore: adicione subcategories?: SubCategoryDTO[] em CategoryDTO se faltar
        subcategories: (c as any).subcategories ?? byCategory[c.id] ?? [],
      }))

      setCategories(merged)
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError
        ? error.message
        : 'Não foi possível carregar categorias e subcategorias.'
      toast.show({ title, placement: 'top', bgColor: 'red.500' })
    } finally {
      if (showLoader) setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll(true)
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadAll(false)
    setRefreshing(false)
  }, [])

  function handleOpenSubcategory(categoryId: string, subcategoryId: string) {
    navigation.navigate('productsBySubCategory', { categoryId, subcategoryId })
  }

  if (isLoading) return <Loading />

  return (
    <VStack flex={1} bg="coolGray.50" px={3} py={2}>
      <RNFlatList
        data={categories}
        keyExtractor={(item) => item.id}
        // ⚠️ Se estiver dentro de um ScrollView PAI, desative o scroll da lista vertical
        scrollEnabled={!insideScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 6 }}
        // Pull-to-refresh APENAS quando a lista controla o scroll
        refreshControl={
          !insideScrollView ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        renderItem={({ item: category }) => {
          // @ts-ignore
          const subs: SubCategoryDTO[] = (category as any).subcategories ?? []

          return (
            <Box
              bg="white"
              borderWidth={1}
              borderColor="coolGray.200"
              rounded="2xl"
              shadow="1"
              px={3}
              py={3}
              mb={3}
            >
              {/* Nome da categoria */}
              <Text fontSize="md" fontWeight="700" color="gray.800" mb={2}>
                {category.name}
              </Text>

              {/* Subcategorias em lista horizontal virtualizada */}
              {subs.length > 0 ? (
                <RNFlatList
                  data={subs}
                  keyExtractor={(sub) => sub.id}
                  horizontal
                  // permite scroll horizontal mesmo com lista vertical desativada
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 4 }}
                  renderItem={({ item: sub }) => (
                    <Pressable
                      onPress={() => handleOpenSubcategory(category.id, sub.id)}
                    >
                      <VStack mr={8} alignItems="center" width={100}>
                        <Box
                          bg="coolGray.100"
                          borderWidth={1}
                          borderColor="coolGray.200"
                          rounded="xl"
                          overflow="hidden"
                          width={100}
                          height={70}
                          alignItems="center"
                          justifyContent="center"
                        >
                          {/* @ts-ignore: image opcional em SubCategoryDTO */}
                          {sub.image ? (
                            <Image
                              source={{ uri: sub.image }}
                              alt={sub.name}
                              width="100%"
                              height="100%"
                              resizeMode="cover"
                              fallbackElement={
                                <Center flex={1}>
                                  <Icon
                                    as={ImageIcon}
                                    size="6"
                                    color="coolGray.500"
                                  />
                                </Center>
                              }
                            />
                          ) : (
                            <Center flex={1}>
                              <Icon
                                as={ImageIcon}
                                size="6"
                                color="coolGray.500"
                              />
                            </Center>
                          )}
                        </Box>

                        <Text
                          mt={1}
                          fontSize="xs"
                          numberOfLines={2}
                          textAlign="center"
                          color="gray.700"
                        >
                          {sub.name}
                        </Text>
                      </VStack>
                    </Pressable>
                  )}
                />
              ) : (
                <Text fontSize="xs" color="coolGray.500">
                  Sem subcategorias.
                </Text>
              )}
            </Box>
          )
        }}
        ListEmptyComponent={
          <Center py={10}>
            <Text color="coolGray.500">Nenhuma categoria encontrada.</Text>
          </Center>
        }
      />
    </VStack>
  )
}
