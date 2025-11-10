import { useNavigation } from '@react-navigation/native'
import { FlatList, VStack } from 'native-base'
import { HeaderList } from '@components/HeaderList'

import { ProductCard } from '@components/Product/ProductCard'
//import { PRODUCTS } from '../../data/products'
import { ProductDTO } from '@dtos/ProductDTO'

type Props = {
  subcategory: string
  product: ProductDTO[]
}

export function Product({ product, subcategory }: Props) {
  const { navigate } = useNavigation()

  return (
    <VStack bg={'gray.100'}>
      <HeaderList title={subcategory} counter={subcategory.length} />

      <FlatList
        data={product}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigate('productDetails', { productId: item.id })}
          />
        )}
        numColumns={2}
        _contentContainerStyle={{
          marginLeft: 8,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      />
    </VStack>
  )
}
