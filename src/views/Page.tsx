import "./Page.css";
import Editor from "../components/Editor";
import Header from "../components/Header";
import PageObject from "../lib/PageObject";
import { Suspense } from "react";
import usePromise from "react-promise-suspense";

type Props = {
  page: PageObject;
};
function Page({ page }: Props) {
  const data = usePromise(PageObject.read, [page]);
  console.log(data);
  return (
    <main className="lotion:page:editor">
      <Editor />
    </main>
  );
}

export default function WithSuspense({ page }: Props) {
  return (
    <div className="lotion:page">
      <Header title={page.name}></Header>
      <Suspense fallback={null}>
        <Page page={page} />
      </Suspense>
    </div>
  );
}
