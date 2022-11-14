import React, { useEffect, useState } from "react";
import axios from "axios";
import useSwr from "swr";
import Image from 'next/image'
import ava from '../../public/uploads/IMG_9553.webp'
import { FilePond } from "../../components/Upload";

export interface IProps {
  acceptedFileTypes?: string;
  allowMultipleFiles?: boolean;
  label: string;
  onChange: (formData: FormData) => void;
  uploadFileName: string;
}

export const UiFileInputButton: React.FC<IProps> = (props) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  const onClickHandler = () => {
    fileInputRef.current?.click();
  };

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }

    const formData = new FormData();

    Array.from(event.target.files).forEach((file) => {
      formData.append(event.target.name, file);
    });

    props.onChange(formData);

    formRef.current?.reset();
  };

  return (
    <form ref={formRef}>
      <button type="button" onClick={onClickHandler}>
        {props.label}
      </button>
      <input
        accept={props.acceptedFileTypes}
        multiple={props.allowMultipleFiles}
        name={props.uploadFileName}
        onChange={onChangeHandler}
        ref={fileInputRef}
        style={{ display: "none" }}
        type="file"
      />
    </form>
  );
};

UiFileInputButton.defaultProps = {
  acceptedFileTypes: "",
  allowMultipleFiles: false,
};

const fetcher = (url) => fetch(url).then((res) => res.json());

function Editor(props) {
  useEffect(() => {
    console.log("Editor", props);
  }, []);

  const onChange = async (formData) => {
    const config = {
      headers: { "content-type": "multipart/form-data" },
      onUploadProgress: (event) => {
        console.log(
          `Current progress:`,
          Math.round((event.loaded * 100) / event.total)
        );
      },
    };

    const response = await axios.post("/api/file", formData, config);

    console.log("response", response.data);
  };
  const { data, error } = useSwr(() => `/api/file`, fetcher);

  const [files, setFiles] = useState([]);

  if (error) return <div>Failed to load user</div>;
  if (!data) return <div>Loading...</div>;
  console.log('data', data)

  return (
    <div className="flex h-screen ">
      <aside className="w-48 bg-neutral-50 h-full shrink-0">
        <div className="m-2 px-4 py-3 bg-slate-200 rounded-md cursor-pointer">
          Imags
        </div>
      </aside>
      <main className="p-4">
        <button
          onClick={() => {
            axios.get("/api/file").then((res) => {
              console.log(res);
            });
          }}
        >
          获取
        </button>
        <Image src={ava} width="200" height="300" alt=""></Image>
        {/* <UiFileInputButton
          label="Upload Single File"
          uploadFileName="theFiles"
          onChange={onChange}
        /> */}
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
      </main>
    </div>
  );
}

export default Editor;
