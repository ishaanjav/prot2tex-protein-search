# standard
import re

# requires install
import numpy as np
import chromadb
import pandas as pd
import openai
import pickle


def sanitize_text(text):
    sanitized_text = re.sub(r'[^a-zA-Z0-9 .,]+', ' ', text)
    return sanitized_text


def get_embedding(text, model="text-embedding-ada-002"):
   text = text.replace("\n", " ")
   return openai.Embedding.create(input=[text], model=model)['data'][0]['embedding']


def load_interpro(path):
    data = pd.read_csv(path)
    # get openai embeddings
    data['text_embeddings'] = [
        get_embedding(text)
        for text in data['Text']
    ]
    return data


def build_db(data, embedding_col, chroma_client):
    assert 'Name' in data.columns
    assert embedding_col in data.columns
    chroma_client = chromadb.Client()
    ids = [sanitize_text(name) for name in data['Name'].values.tolist()]
    documents = data['Text'].values.tolist()
    embeddings = data[embedding_col].values.tolist()
    collection = chroma_client.create_collection(name="text_embd")
    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=[
            {
                'interpro_id': interpro_id,
                'url': f'https://alphafold.ebi.ac.uk/entry/{interpro_id}/',
            } for interpro_id in data['ID'].values.tolist()
        ]
    )
    return collection


def query_db(*, query_embedding, collection, n):
    results = collection.query(
        query_embedding,
        n_results=n,
    )
    return results


def run_query_text(query_text, n, data_file):
    chroma_client = chromadb.Client()
    data = load_interpro(data_file)
    query_embedding = get_embedding(query_text)
    collection = build_db(data, 'text_embeddings', chroma_client)
    results = query_db(query_embedding=query_embedding,
                       collection=collection, n=n)
    return results


def text_to_esm_embedding(
        text_embedding,
        esm_dimension,
        linear_transform_file='./W.npy'
):
    text_embedding = np.array(text_embedding)
    if linear_transform_file == 'random':
        linear_transform = np.random.randn(len(text_embedding), esm_dimension)
    else:
        linear_transform = np.load(linear_transform_file).T
    return np.matmul(text_embedding.reshape(1, -1), linear_transform).tolist()


def run_query_esm(query_text, n, data_file='./fully_embedded_data.pkl'):
    chroma_client = chromadb.Client()
    data = pickle.load(open(data_file, 'rb'))
    esm_dimension = len(data['esm_embedding'][0])
    text_embedding = get_embedding(query_text)
    esm_embedding = text_to_esm_embedding(text_embedding, esm_dimension)
    collection = build_db(data, 'esm_embedding', chroma_client)
    results = query_db(query_embedding=esm_embedding,
                       collection=collection, n=n)
    return results


if __name__ == '__main__':
    from pprint import pprint
    query_text = "Activates ubiquitin"
    results = run_query_text(query_text, data_file='./interpro_data.csv', n=3)
    pprint(results)

    results = run_query_esm(query_text, n=2)
    pprint(results)


'''
Example output:
{'distances': [[0.21732863783836365, 0.3238351047039032, 0.36990225315093994]],
 'documents': [['Activates ubiquitin by first adenylating its C-terminal '
                'glycine residue with ATP, and thereafter linking this residue '
                'to the side chain of a cysteine residue in E1, yielding a '
                'ubiquitin-E1 thioester and free AMP. Specific for ubiquitin, '
                'does not activate ubiquitin-like peptides. Differs from UBE1 '
                'in its specificity for substrate E2 charging. Does not charge '
                'cell cycle E2s, such as CDC34. Essential for embryonic '
                'development. Required for UBD/FAT10 conjugation. Isoform 2 '
                'may play a key role in ubiquitin system and may influence '
                'spermatogenesis and male fertility',
                'E3 ubiquitin-protein ligase involved in ER-associated protein '
                'degradation, preferentially associates with the E2 enzyme '
                'UBE2J2. Exploited by viral US11 proteins to mediate HLA class '
                'I proteins degradation',
                'Acts as a GTPase activating protein for RAB5. Does not act on '
                'RAB4 or RAB11 (By similarity)']],
 'embeddings': None,
 'ids': [['Ubiquitin like modifier activating enzyme 6',
          'E3 ubiquitin protein ligase TM129',
          'TBC1 domain family member 3D']],
 'metadatas': [[None, None, None]]}
'''
