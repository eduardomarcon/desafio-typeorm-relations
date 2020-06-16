import { getRepository, Repository } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });
    await this.ormRepository.save(product);
    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({ where: { name } });
    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findAllProductsById = await this.ormRepository.findByIds(products);
    return findAllProductsById;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const ids = products.map(product => product.id);
    const findAllProductsById = await this.ormRepository.findByIds(ids);
    const newProducts = findAllProductsById.map(product => {
      const productFound = products.find(
        productFind => productFind.id === product.id,
      );
      const quantity =
        product.quantity - (productFound ? productFound.quantity : 0);
      return {
        ...product,
        quantity,
      };
    });
    await this.ormRepository.save(newProducts);
    return newProducts;
  }
}

export default ProductsRepository;
