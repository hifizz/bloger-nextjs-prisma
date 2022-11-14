import prisma from '../../lib/prisma';

class ImageService {
  async create({ key, name, url }: { key: string; name?:string; url: string; }) {
    const post = await prisma.image.create({
      data: {
        key,
        url,
        name,
      },
    });
    return post;
  }
}

const imageService = new ImageService();

export default imageService;
