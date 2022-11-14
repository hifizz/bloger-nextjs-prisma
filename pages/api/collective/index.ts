import { NextApiHandler } from 'next';
import prisma from '../../../lib/prisma';

const handle: NextApiHandler = async (req, res) => {
  if (req.method === 'POST') {
    const { name, imageIds } = req.body;
    const images = imageIds.map((imageId) => ({
      id: imageId
    }));
    console.log('---->', req.body, name, imageIds)
    const post = await prisma.imageCollective.create({
      data: {
        name,
        cover: imageIds[0],
        images: {
          connect: images,
        },
      },
    });
    res.json(post);
  }
}

export default handle;
