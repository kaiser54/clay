// ============ CORE/PRIMITIVE TYPES ============

export interface Money {
    amount: number;
    currency: string;
    formatted: string; // e.g., "$1,299.99"
}

export interface Dimensions {
    length: number; // cm
    width: number;
    height: number;
    unit: 'cm' | 'in';
}

export interface Weight {
    value: number;
    unit: 'g' | 'kg' | 'oz' | 'lb';
}

// ============ MEDIA TYPES ============

export interface ProductImage {
    id: string;
    url: string;
    thumbnail: string;
    medium: string;
    large: string;
    alt: string;
    position: number;
    isPrimary: boolean;
}

export interface ProductVideo {
    id: string;
    url: string;
    thumbnail: string;
    title: string;
    provider: 'youtube' | 'vimeo';
    duration: number; // seconds
}

// ============ PRICING TYPES ============

export interface Pricing {
    current: Money;
    original?: Money; // For sale items
    costPerItem?: Money; // Your cost
    discountPercentage?: number;
    isOnSale: boolean;
}

// ============ INVENTORY TYPES ============

export interface Inventory {
    quantity: number;
    stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'BACKORDER' | 'PREORDER';
    isTracked: boolean;
    lowStockThreshold?: number;
    isLowStock: boolean;
}

// ============ VARIANT TYPES ============

export interface VariantAttribute {
    name: string; // e.g., "Size", "Color"
    value: string; // e.g., "Large", "Red"
}

export interface ProductVariant {
    id: string;
    sku: string;
    attributes: VariantAttribute[];
    pricing: Pricing;
    inventory: Inventory;
    images: ProductImage[];
    isDefault: boolean;
}

// ============ CATEGORY & TAG TYPES ============

export interface Category {
    id: string;
    name: string;
    slug: string;
    breadcrumbs: CategoryBreadcrumb[];
}

export interface CategoryBreadcrumb {
    id: string;
    name: string;
    slug: string;
}

export interface Tag {
    id: string;
    name: string;
    slug: string;
}

// ============ REVIEW TYPES ============

export interface ReviewAuthor {
    id: string;
    name: string;
    isVerifiedPurchaser: boolean;
}

export interface ReviewReply {
    content: string;
    createdAt: string; // ISO datetime
}

export interface ProductReview {
    id: string;
    author: ReviewAuthor;
    rating: number; // 1-5
    title: string;
    content: string;
    helpfulCount: number;
    images: string[]; // Image URLs
    reply?: ReviewReply;
    createdAt: string;
}

export interface RatingSummary {
    average: number;
    count: number;
    distribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

// ============ SEO TYPES ============

export interface SeoMetadata {
    title: string;
    description: string;
    canonicalUrl: string;
    metaTags: MetaTag[];
    structuredData: Record<string, any>;
}

export interface MetaTag {
    name: string;
    content: string;
}

// ============ SHIPPING TYPES ============

export interface ShippingInfo {
    requiresShipping: boolean;
    weight?: Weight;
    dimensions?: Dimensions;
    estimatedDelivery?: DeliveryEstimate;
}

export interface DeliveryEstimate {
    minDays: number;
    maxDays: number;
    displayText: string; // e.g., "3-5 business days"
}

// ============ DIGITAL PRODUCT TYPES ============

export interface DigitalProductInfo {
    fileSize: string; // e.g., "2.5 MB"
    fileType: string; // e.g., "PDF"
    downloadLimit: number;
    expiresAfterDays?: number;
}

// ============ BUNDLE TYPES ============

export interface BundledItem {
    productId: string;
    productName: string;
    productSlug: string;
    variantId?: string;
    variantName?: string;
    quantity: number;
    thumbnail: string;
}

export interface BundleInfo {
    items: BundledItem[];
    savings: Money;
}

// ============ MAIN PRODUCT RESPONSE ============

export interface GetProductResponse {
    // Core
    id: string;
    sku: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;

    // Type & Status
    type: 'SIMPLE' | 'VARIABLE' | 'DIGITAL' | 'SERVICE' | 'BUNDLE';
    status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';

    // Media
    images: ProductImage[];
    videos: ProductVideo[];
    featuredImage: ProductImage;

    // Pricing
    pricing: Pricing;

    // Variants (for VARIABLE type)
    variants: ProductVariant[];
    defaultVariant?: ProductVariant;

    // Inventory (for SIMPLE type)
    inventory?: Inventory;

    // Categories & Tags
    categories: Category[];
    tags: Tag[];

    // Reviews
    reviews: ProductReview[];
    ratingSummary: RatingSummary;

    // SEO
    seo: SeoMetadata;

    // Shipping
    shipping: ShippingInfo;

    // Digital/Bundle specifics
    digitalInfo?: DigitalProductInfo;
    bundleInfo?: BundleInfo;

    // Cross-sells
    relatedProducts: RelatedProduct[];
    upsellProducts: RelatedProduct[];
    crossSellProducts: RelatedProduct[];

    // Metadata
    metadata: ProductMetadata;

    // Dates
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// ============ RELATED PRODUCT TYPES ============

export interface RelatedProduct {
    id: string;
    name: string;
    slug: string;
    featuredImage: string;
    pricing: Pricing;
    type: GetProductResponse['type'];
}

// ============ METADATA TYPES ============

export interface ProductMetadata {
    isFeatured: boolean;
    isNewArrival: boolean;
    isBestSeller: boolean;
    tagsForFiltering: string[];
    customFields: CustomField[];
}

export interface CustomField {
    key: string;
    label: string;
    value: string | number | boolean;
    type: 'text' | 'number' | 'boolean' | 'date';
}
