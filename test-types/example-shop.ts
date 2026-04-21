interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
}
