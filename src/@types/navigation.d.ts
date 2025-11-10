export declare global {
  namespace ReactNavigation {
    interface RootParamList {
      home: { userId: string }
      productBySubCategory: { userId: string; categoryId: string; productId }
    }
  }
}
