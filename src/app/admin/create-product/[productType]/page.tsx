import { notFound } from 'next/navigation';
import { ProductStudioPage } from '../page';

type ProductTypeRouteParams = {
  productType: string;
};

const productTypes = ['glitter_rose', 'velvet_flower'] as const;

type ProductStudioType = (typeof productTypes)[number];

function isProductStudioType(value: string): value is ProductStudioType {
  return productTypes.includes(value as ProductStudioType);
}

export default async function CreateProductTypePage({
  params,
}: {
  params: Promise<ProductTypeRouteParams>;
}) {
  const { productType } = await params;

  if (!isProductStudioType(productType)) {
    notFound();
  }

  return <ProductStudioPage initialProductType={productType} />;
}
