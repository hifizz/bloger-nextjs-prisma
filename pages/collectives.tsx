// pages/drafts.tsx

import React, { useState } from "react";
import { GetServerSideProps } from 'next';
import { useSession, getSession } from 'next-auth/react';
import Layout from '../components/Layout';
import Post, { PostProps } from '../components/Post';
import prisma from '../lib/prisma';
import { FilePond } from "../components/Upload";
import Axios from 'axios'


export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getSession({ req });
  if (!session) {
    res.statusCode = 403;
    return { props: { drafts: [] } };
  }

  const imageCollective = await prisma.imageCollective.findMany({
    include: {
      images: true
    }
  });
  return {
    props: { imageCollective },
  };
};

const Collective = () => {
  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    setIsSubmitting(true);
    const requestPayload = {
      name,
      imageIds: files.map(file => {
        if(file?.serverId) {
          return JSON.parse(file?.serverId).id
        }
        return file?.serverId
      }).filter(file => !!file),
    }
    e.preventDefault();
    console.log('requestPayload', requestPayload);
    try {
      await Axios.post('/api/collective', requestPayload)
    } catch(error) {
      console.log('error', error);
    }
    
    setIsSubmitting(false);
  };
  return (
    <div className="">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 w-80">
        <label className="block">
          <span className="text-gray-700">图集名称</span>
          <input
            type="text"
            name="name"
            onChange={(e) => {
              setName(e.target.value);
            }}
            value={name}
            className="mt-1 block w-full rounded-md  border-gray-300 shadow-sm  focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 "
            placeholder=""
          />
        </label>
        <FilePond
          className="w-120"
          files={files}
          onupdatefiles={setFiles}
          allowMultiple={true}
          maxFiles={50}
          onprocessfile={(error, info) => {
            console.log("onprocessfiles", error, info);
          }}
          onprocessfiles={() => {
            console.log("onprocessfiles");
          }}
          server="/api/file"
          name="theFiles"
          labelIdle='拖动文件上传 或者 <span class="filepond--label-action">浏览选择文件</span>'
          credits={false}
          labelFileProcessing="上传中"
          labelFileProcessingComplete="上传成功"
          labelFileProcessingAborted="上传已取消"
          labelTapToUndo="点击撤销"
          labelTapToRetry="点击重试"
          labelTapToCancel="点击取消"
          labelButtonRetryItemLoad="重试"
          labelButtonProcessItem="上传"
          labelButtonRetryItemProcessing="重试"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="motion-reduce:hidden animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              保存中...
            </>
          ) : (
            "保存"
          )}
        </button>
      </form>
    </div>
  );
};

const CollectiveList = () => {
  return <div></div>
}

type Props = {
  imageCollective: [];
};

const Collectives: React.FC<Props> = (props) => {
  const { data: session } = useSession();
  const [files, setFiles] = useState([]);
  console.log(props.imageCollective)

  if (!session) {
    return (
      <Layout>
        <h1>My Drafts</h1>
        <div>You need to be authenticated to view this page.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page">
        <h1 className="text-lg">Photos Collective</h1>
        <div className="bg-neutral-50 p-4">
          <div className="text-xl">创建图集</div>
          <div><Collective />
          </div>
        </div>
        <div className="bg-neutral-50 mt-8 p-4">
          <div className="text-xl">图集列表</div>
          <div>
          <main>
          {props.imageCollective.map((collective) => (
            <div key={collective.id} className="post">
              <div>{collective.name}</div>
              <div >
                <img src={collective.images?.[0]?.url} style={{width: '300px', height: 'auto', objectFit: 'cover' }} />
              </div>
            </div>
          ))}
        </main>
          </div>
        </div>
        <div className="bg-neutral-50 mt-8 p-4">
          <div>上传图片</div>
          <div>
          <FilePond
          className="w-60"
          files={files}
          onupdatefiles={setFiles}
          allowMultiple={true}
          maxFiles={50}
          server="/api/file"
          name="theFiles"
          labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
        />
          </div>
        </div>
        
      </div>
      <style jsx>{`
        .post {
          background: var(--geist-background);
          transition: box-shadow 0.1s ease-in;
        }

        .post:hover {
          box-shadow: 1px 1px 3px #aaa;
        }

        .post + .post {
          margin-top: 2rem;
        }
      `}</style>
    </Layout>
  );
};

export default Collectives;
