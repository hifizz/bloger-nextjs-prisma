import { NextApiHandler } from 'next';
import prisma from '../../../lib/prisma';

const handle: NextApiHandler = async (req, res) => {
  const post = await prisma.image.create({
    data: {
      url: 'https://cdn.zilin.cc/DSC02945_1.jpg',
      name: '雍和宫'
    },
  });
  res.json(post);
}

export default handle;
