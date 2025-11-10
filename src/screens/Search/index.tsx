import { HomeHeader } from '@components/HomeHeader'
import { HomeScreen } from '@components/HomeScreen'
import { Center, Text, VStack } from 'native-base'
import { ProductList } from '../Product/ProductList'

export function Search() {
  return (
    <VStack>
      <HomeScreen title="Pesquisar" />
    </VStack>
  )
}
