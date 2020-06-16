import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('customer not found');
    }
    const productsIds = products.map(product => {
      return { id: product.id };
    });
    const productsExists = await this.productsRepository.findAllById(
      productsIds,
    );
    const totalProductNotFound = products.length - productsExists.length;
    if (totalProductNotFound > 0) {
      throw new AppError(`total ${totalProductNotFound} not found`);
    }
    const productsFinal = productsExists.map(productData => {
      const productFinal = products.find(
        productFind => productFind.id === productData.id,
      );
      const quantityFinal = productFinal ? productFinal?.quantity : 0;
      if (productData.quantity < quantityFinal) {
        throw new AppError(`quantity ${totalProductNotFound} insufficient`);
      }
      return {
        product_id: productData.id,
        price: productData.price,
        quantity: productFinal?.quantity || 0,
      };
    });
    await this.productsRepository.updateQuantity(products);
    const order = await this.ordersRepository.create({
      customer,
      products: productsFinal,
    });
    return order;
  }
}

export default CreateOrderService;
