export async function searchOpenFoodFacts(barcode: string) {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1) {
      const product = data.product;
      return {
        name: product.product_name || product.product_name_en,
        brands: product.brands,
        categories: product.categories,
        generic_name: product.generic_name || product.generic_name_en,
        quantity: product.quantity,
        image_url: product.image_url,
        manufacturing_places: product.manufacturing_places,
        // You can add more fields from the API response as needed
      };
    }
    return null;
  } catch (error) {
    console.error('Error searching OpenFoodFacts:', error);
    return null;
  }
}
