import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/lib/types";

const categories = [
  { id: "all", name: "Todos" },
  { id: "oil", name: "Óleos" },
  { id: "gummies", name: "Gomas" },
  { id: "cream", name: "Tópicos" },
  { id: "cosmetic", name: "Cosméticos" },
];

export default function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedCategory !== "all" ? selectedCategory : undefined].filter(Boolean),
  });

  // Sample products for display when no data
  const sampleProducts = [
    {
      id: "1",
      name: "Óleo Cannabis Medicinal Full Spectrum",
      description: "Indicado para dor crônica e ansiedade",
      category: "oil",
      concentration: "600mg",
      price: "450",
      imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
    },
    {
      id: "2", 
      name: "Gomas Cannabis Medicinal Sabor Frutas",
      description: "30 unidades para ansiedade e sono",
      category: "gummies",
      concentration: "10mg",
      price: "280",
      imageUrl: "https://images.unsplash.com/photo-1582610285985-a42d9193f2fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
    },
    {
      id: "3",
      name: "Creme Cannabis Medicinal Anti-inflamatório", 
      description: "Para dores musculares e articulares",
      category: "cream",
      concentration: "500mg",
      price: "320",
      imageUrl: "https://images.unsplash.com/photo-1556229174-f6803a1f032a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
    },
    {
      id: "4",
      name: "Shampoo Cannabis Medicinal Revitalizante",
      description: "Para couro cabeludo sensível", 
      category: "cosmetic",
      concentration: "250ml",
      price: "180",
      imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
    }
  ];

  const displayProducts = products.length > 0 ? products : sampleProducts;
  const filteredProducts = selectedCategory === "all" 
    ? displayProducts 
    : displayProducts.filter(product => product.category === selectedCategory);

  const getCategoryDisplayName = (category: string) => {
    const names = {
      oil: "Óleo",
      gummies: "Gomas",
      cream: "Tópico", 
      cosmetic: "Cosmético",
    };
    return names[category as keyof typeof names] || category;
  };

  return (
    <section id="produtos" className="py-20 bg-white" data-testid="product-catalog-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-testid="catalog-title">
            Nossos Produtos
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="catalog-description">
            Linha completa de produtos à base de Cannabis Medicinal para diferentes necessidades
          </p>
        </div>

        {/* Product Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-full font-medium transition-colors ${
                selectedCategory === category.id
                  ? "bg-vitta-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-vitta-light"
              }`}
              data-testid={`category-filter-${category.id}`}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border border-gray-100" data-testid={`product-skeleton-${index}`}>
                <Skeleton className="w-full h-48" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredProducts.slice(0, 4).map((product) => (
              <Card key={product.id} className="card-hover overflow-hidden border border-gray-100" data-testid={`product-card-${product.id}`}>
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-48 object-cover"
                  data-testid={`product-image-${product.id}`}
                />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant="secondary" 
                      className="bg-vitta-light text-vitta-primary"
                      data-testid={`product-category-${product.id}`}
                    >
                      {getCategoryDisplayName(product.category)}
                    </Badge>
                    <span className="text-vitta-primary font-semibold" data-testid={`product-concentration-${product.id}`}>
                      {product.concentration}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2" data-testid={`product-name-${product.id}`}>
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4" data-testid={`product-description-${product.id}`}>
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-vitta-primary" data-testid={`product-price-${product.id}`}>
                      R$ {product.price}
                    </span>
                    <Link href="/consulta">
                      <Button 
                        className="bg-vitta-primary text-white hover:bg-vitta-accent transition-colors text-sm touch-target"
                        data-testid={`product-details-${product.id}`}
                      >
                        Consulta Médica
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* View All Products */}
        <div className="text-center mt-12">
          <Link href="/produtos">
            <Button 
              className="bg-vitta-primary text-white hover:bg-vitta-accent px-8 py-3"
              data-testid="button-view-all-products"
            >
              Ver Todos os Produtos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
