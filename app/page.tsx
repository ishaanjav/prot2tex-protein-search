"use client"
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import DropDown, { VibeType } from "../components/DropDown";
import Footer from "../components/Footer";
import Github from "../components/GitHub";
import Header from "../components/Header";
// import LoadingDots from "../components/LoadingDots";


import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

const Home: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [vibe, setVibe] = useState<VibeType>("Text2Text");
  const [generatedBios, setGeneratedBios] = useState<String>("");

  // const [proteinResults, setProteinResults] = useState<String>("");
  const [proteinResults, setProteinResults] = useState([{
    distance: 0, document: "", id: "", metadata: {
      'interpro_id': 'a',
      'url': 'a',
    }
  }]);

  const bioRef = useRef<null | HTMLDivElement>(null);

  const scrollToResults = () => {
    if (bioRef.current !== null) {
      bioRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const prompt = `Generate 2 ${vibe} twitter biographies with no hashtags and clearly labeled "1." and "2.". ${vibe === "Funny"
    ? "Make sure there is a joke in there and it's a little ridiculous."
    : null
    }
      Make sure each generated biography is less than 160 characters, has short sentences that are found in Twitter bios, and base them on this context: ${input}${input.slice(-1) === "." ? "" : "."
    }`;

  const generateBio = async (e: any) => {
    e.preventDefault();
    setGeneratedBios("");
    setLoading(true);
    // const input = 'Activates ubiquitin';  // Comment out to use actual textbox input

    let API_URL = "http://localhost:5000/run_protex_text";
    if (vibe === "ESM") {
      API_URL = "http://localhost:5000/run_protex_esm"
    }
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 'text_query': input })
    })
      .then(response => response.json())
      .then(data => {
        console.log("DATA:", data);  // Process the received data as needed
        // console.log(data[0])
        const sortedObjects = [];
        for (let i = 0; i < data.distances[0].length; i++) {
          const object = {
            distance: data.distances[0][i],
            document: data.documents[0][i],
            id: data.ids[0][i],
            metadata: data.metadatas[0][i]
          };

          sortedObjects.push(object);
        }

        // Sort the array of objects by ascending distance
        sortedObjects.sort((a, b) => a.distance - b.distance);
        setProteinResults(sortedObjects)
        setLoading(false);
        scrollToResults();


        sortedObjects.forEach((object) => {
          console.log(object);
        });

      })
      .catch(error => console.error("ERROR:", error));

    return;
    // const response = await fetch("/api/generate", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     prompt,
    //   }),
    // });

    // if (!response.ok) {
    //   throw new Error(response.statusText);
    // }

    // // This data is a ReadableStream
    // const data = response.body;
    // if (!data) {
    //   return;
    // }

    const onParse = (event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        const data = event.data;
        try {
          const text = JSON.parse(data).text ?? ""
          setGeneratedBios((prev) => prev + text);
        } catch (e) {
          console.error(e);
        }
      }
    }

    // https://web.dev/streams/#the-getreader-and-read-methods
    const reader = data.getReader();
    const decoder = new TextDecoder();
    const parser = createParser(onParse);
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      parser.feed(chunkValue);
    }
    scrollToResults();
    setLoading(false);
  };
  function Scene() {
    // const gltf = useLoader(GLTFLoader, './AF-B2MVY4-F1.gltf')
    // return <primitive object={gltf.scene} />

  }

  return (
    <div className="flex max-w-5xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Head>
        <title>Protein Generator</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-12 sm:mt-20">

        <h1 className="sm:text-6xl text-4xl max-w-[708px] font-bold text-slate-900" style={{ color: '#8365c2' }}>
          Search proteins by natural-language functional description
        </h1>
        <p className="text-slate-500 mt-5"><i>498,828 proteins found so far.</i></p>
        <div className="max-w-xl w-full">
          <div className="flex mt-10 items-center space-x-3">
            <Image
              src="/1-black.png"
              width={30}
              height={30}
              alt="1 icon"
              className="mb-5 sm:mb-0"
            />
            <p className="text-left font-medium">
              Query{" "}
              <span className="text-slate-500">
                (describe the function in natural language)
              </span>
            </p>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black my-5"
            placeholder={
              "e.g. Find proteins that can help degrade tyrosine phosphatase 1"
            }
          />
          <div className="flex mb-5 items-center space-x-3">
            <Image src="/2-black.png" width={30} height={30} alt="1 icon" />
            <p className="text-left font-medium">Choose your mode</p>
          </div>
          <div className="block">

            <DropDown vibe={vibe} setVibe={(newVibe) => setVibe(newVibe)} />
          </div>

          {!loading && (
            <button
              className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
              onClick={(e) => generateBio(e)}
            >
              Find your protein &rarr;
            </button>
          )}
          {loading && (
            <button
              className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
              disabled
            >
              ...
              {/* <LoadingDots color="white" style="large" /> */}
            </button>
          )}
        </div>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{ duration: 2000 }}
        />
        <hr className="h-px bg-gray-700 border-1 dark:bg-gray-700" />
        <div style={{ marginTop: '70px' }} className="space-y-10 my-10">
          {proteinResults.length > 1 && (
            <>
              <div>
                <h2
                  className="sm:text-4xl text-3xl font-bold text-slate-900 mx-auto"
                  ref={bioRef}
                >
                  Your protein matches
                </h2>
              </div>
              {/* {Scene()} */}

              <div className="space-y-8 flex flex-col items-center justify-center max-w-xl mx-auto">
                {proteinResults
                  .map((protein) => {
                    return (
                      <div
                        className="bg-white rounded-xl shadow-md p-4 hover:bg-gray-100 transition border"
                        /* const object = {
            distance: data.distances[0][i],
            document: data.documents[0][i],
            id: data.ids[0][i],
            metadata: data.metadatas[0][i]
          }; */
                        onClick={() => {
                          navigator.clipboard.writeText(protein.document);
                          toast("Protein copied to clipboard", {
                            icon: "✂️",
                          });
                        }}
                        key={protein.id}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          {/* https://www.ebi.ac.uk/interpro/protein/reviewed/A0A087WXM9/alphafold */}
                          {/* onst url = 'https://www.example.com'; // Replace with your desired URL */}

                          <p className="font-semibold" style={{ textAlign: "left", cursor: 'pointer' }} onClick={() => { window.open(protein.metadata.url + 'alphafold', '_blank') }}>
                            {protein.id}
                          </p>
                          <p className="font-semibold" style={{ textAlign: "right", color: '#8c72c2' }}>
                            {protein.distance.toFixed(2)}
                          </p>
                        </div>


                        <p style={{ color: '#222', marginTop: '10px', textAlign: 'left' }}>{protein.document}</p>

                      </div>
                    );
                  })}
                {/* {generatedBios
                  .substring(generatedBios.indexOf("1") + 3)
                  .split("2.")
                  .map((generatedBio) => {
                    return (
                      <div
                        className="bg-white rounded-xl shadow-md p-4 hover:bg-gray-100 transition cursor-copy border"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedBio);
                          toast("Bio copied to clipboard", {
                            icon: "✂️",
                          });
                        }}
                        key={generatedBio}
                      >
                        <p>{generatedBio}</p>
                      </div>
                    );
                  })} */}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
// 'use client';

// import Image from 'next/image';
// import { useRef, useState } from 'react';
// import { Toaster, toast } from 'react-hot-toast';
// import DropDown, { VibeType } from '../components/DropDown';
// import Footer from '../components/Footer';
// import Github from '../components/GitHub';
// import Header from '../components/Header';
// import { useChat } from 'ai/react';

// export default function Page() {
//   const [bio, setBio] = useState('');
//   const [vibe, setVibe] = useState<VibeType>('Professional');
//   const bioRef = useRef<null | HTMLDivElement>(null);

//   const scrollToBios = () => {
//     if (bioRef.current !== null) {
//       bioRef.current.scrollIntoView({ behavior: 'smooth' });
//     }
//   };

//   const { input, handleInputChange, handleSubmit, isLoading, messages } =
//     useChat({
//       body: {
//         vibe,
//         bio,
//       },
//       onResponse() {
//         scrollToBios();
//       },
//     });

//   const onSubmit = (e: any) => {
//     setBio(input);
//     handleSubmit(e);
//   };

//   const lastMessage = messages[messages.length - 1];
//   const generatedBios = lastMessage?.role === "assistant" ? lastMessage.content : null;

//   return (
//     <div className="flex max-w-5xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
//       <Header />
//       <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-12 sm:mt-20">
//         <a
//           className="flex max-w-fit items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 shadow-md transition-colors hover:bg-gray-100 mb-5"
//           href="https://github.com/Nutlope/twitterbio"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Github />
//           <p>Star on GitHub</p>
//         </a>
//         <h1 className="sm:text-6xl text-4xl max-w-[708px] font-bold text-slate-900">
//           Generate your next Twitter bio using chatGPT
//         </h1>
//         <p className="text-slate-500 mt-5">47,118 bios generated so far.</p>
//         <form className="max-w-xl w-full" onSubmit={onSubmit}>
//           <div className="flex mt-10 items-center space-x-3">
//             <Image
//               src="/1-black.png"
//               width={30}
//               height={30}
//               alt="1 icon"
//               className="mb-5 sm:mb-0"
//             />
//             <p className="text-left font-medium">
//               Copy your current bio{' '}
//               <span className="text-slate-500">
//                 (or write a few sentences about yourself)
//               </span>
//               .
//             </p>
//           </div>
//           <textarea
//             value={input}
//             onChange={handleInputChange}
//             rows={4}
//             className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black my-5"
//             placeholder={
//               'e.g. Senior Developer Advocate @vercel. Tweeting about web development, AI, and React / Next.js. Writing nutlope.substack.com.'
//             }
//           />
//           <div className="flex mb-5 items-center space-x-3">
//             <Image src="/2-black.png" width={30} height={30} alt="1 icon" />
//             <p className="text-left font-medium">Select your vibe.</p>
//           </div>
//           <div className="block">
//             <DropDown vibe={vibe} setVibe={(newVibe) => setVibe(newVibe)} />
//           </div>

//           {!isLoading && (
//             <button
//               className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
//               type="submit"
//             >
//               Generate your bio &rarr;
//             </button>
//           )}
//           {isLoading && (
//             <button
//               className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
//               disabled
//             >
//               <span className="loading">
//                 <span style={{ backgroundColor: 'white' }} />
//                 <span style={{ backgroundColor: 'white' }} />
//                 <span style={{ backgroundColor: 'white' }} />
//               </span>
//             </button>
//           )}
//         </form>
//         <Toaster
//           position="top-center"
//           reverseOrder={false}
//           toastOptions={{ duration: 2000 }}
//         />
//         <hr className="h-px bg-gray-700 border-1 dark:bg-gray-700" />
//         <output className="space-y-10 my-10">
//           {generatedBios && (
//             <>
//               <div>
//                 <h2
//                   className="sm:text-4xl text-3xl font-bold text-slate-900 mx-auto"
//                   ref={bioRef}
//                 >
//                   Your generated bios
//                 </h2>
//               </div>
//               <div className="space-y-8 flex flex-col items-center justify-center max-w-xl mx-auto">
//                 {generatedBios
//                   .substring(generatedBios.indexOf('1') + 3)
//                   .split('2.')
//                   .map((generatedBio) => {
//                     return (
//                       <div
//                         className="bg-white rounded-xl shadow-md p-4 hover:bg-gray-100 transition cursor-copy border"
//                         onClick={() => {
//                           navigator.clipboard.writeText(generatedBio);
//                           toast('Bio copied to clipboard', {
//                             icon: '✂️',
//                           });
//                         }}
//                         key={generatedBio}
//                       >
//                         <p>{generatedBio}</p>
//                       </div>
//                     );
//                   })}
//               </div>
//             </>
//           )}
//         </output>
//       </main>
//       <Footer />
//     </div>
//   );
// }
