import { ProductCardProps } from '@components/Product/ProductCard'
import { ImageProps } from 'react-native'

interface ProductProps {
  id: string
  brand: string
  category: string
  subcategory: string
  name: string
  price: string
  unity: string
  thumb: ImageProps['source']
  image: ImageProps['source']
  description: string
  observation: string
}

export const PRODUCTS: ProductProps[] = [
  {
    id: '1',
    brand: 'Tang',
    category: 'Carnes & Peixes',
    subcategory: 'Carnes Bovinas',
    name: 'Charque Traseiro Bovino Pedaço 500g',
    price: '21,99',
    unity: '500 G',
    thumb: require('../assets/img/carne.png'),
    image: require('../assets/img/carne.png'),
    description:
      'Charque traseiro , corte salgado mais macia e magra. , dessecado e curado ao sol no ponto certo. O charque, sendo Jabá no norte e Carne Seca no sudeste, teve origem no Nordeste do Brasil no fim do século XVII visando a conservação da carne. O traseiro é mais macia e magra.',
    observation:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
  },
  {
    id: '2',
    brand: 'Tang',
    category: 'Carnes & Peixes',
    subcategory: 'Carnes Bovinas',
    name: 'Refresco para misturar com leite Sabor Morango',
    price: '5,90',
    unity: '125G',
    thumb: require('../assets/img/carne.png'),
    image: require('../assets/img/bebida.png'),
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    observation:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
  },
  {
    id: '3',
    brand: 'Tang',
    category: 'Carnes & Peixes',
    subcategory: 'Carnes Bovinas',
    name: 'Refresco para misturar com leite Sabor Morango',
    price: '8,96',
    unity: '125G',
    thumb: require('../assets/img/frios.png'),
    image: require('../assets/img/carne.png'),
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    observation:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
  },
  {
    id: '4',
    brand: 'Tang',
    category: 'Carnes & Peixes',
    subcategory: 'Carnes Bovinas',
    name: 'Refresco para misturar com leite Sabor Morango',
    price: '8,94',
    unity: '125G',
    thumb: require('../assets/img/bebida.png'),
    image: require('../assets/img/frios.png'),
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    observation:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
  },
  {
    id: '5',
    brand: 'Tang',
    category: 'Carnes & Peixes',
    subcategory: 'Carnes Bovinas',
    name: 'Refresco para misturar com leite Sabor Morango',
    price: '8,94',
    unity: '125G',
    thumb: require('../assets/img/carne.png'),
    image: require('../assets/img/carne.png'),
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    observation:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
  },
  {
    id: '6',
    brand: 'Tang',
    category: 'Bebidas',
    subcategory: 'Aves',
    name: 'Refresco para misturar com leite Sabor Morango',
    price: '8,94',
    unity: '125G',
    thumb: require('../assets/img/carne.png'),
    image: require('../assets/img/bebida.png'),
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    observation:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
  },
  {
    id: '7',
    brand: 'Tang',
    category: 'Higiene & Perfumaria',
    subcategory: 'Aves',
    name: 'Refresco para misturar com leite Sabor Morango',
    price: '8,94',
    unity: '125G',
    thumb: require('../assets/img/carne.png'),
    image: require('../assets/img/carne.png'),
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    observation:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
  },
  {
    id: '9',
    brand: 'Tang',
    category: 'Carnes & Peixes',
    subcategory: 'Peixes',
    name: 'Refresco para misturar com leite Sabor Morango',
    price: '8,94',
    unity: '125G',
    thumb: require('../assets/img/carne.png'),
    image: require('../assets/img/carne.png'),
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    observation:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
  },
  {
    id: '10',
    brand: 'Tang',
    category: 'Frios & Laticínios',
    subcategory: 'Linguiças',
    name: 'Refresco para misturar com leite Sabor Morango',
    price: '8,94',
    unity: '125G',
    thumb: require('../assets/img/frios.png'),
    image: require('../assets/img/frios.png'),
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    observation:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
  },
]
