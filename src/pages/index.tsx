import { GetStaticProps } from 'next';
import Link from 'next/link';

import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string | null;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<PostPagination>(postsPagination);

  async function handleLoadMorePosts() {
    try {
      const response = await fetch(postsPagination.next_page);
      const { results, next_page } = await response.json();

      const data = results.map((post: Post) => ({
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      }));

      setPosts(state => {
        return {
          results: [...state.results, ...data],
          next_page,
        };
      });
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <main className={commonStyles.container}>
      <div className={styles.posts}>
        {posts.results.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a key={post.uid}>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div>
                <div className={styles.info}>
                  <FiCalendar size={20} />
                  <time>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                </div>
                <div className={styles.info}>
                  <FiUser size={20} />
                  <p>{post.data.author}</p>
                </div>
              </div>
            </a>
          </Link>
        ))}

        {posts.next_page && (
          <button
            className={styles.carregarPosts}
            onClick={handleLoadMorePosts}
            type="button"
          >
            Carregar mais posts
          </button>
        )}
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 2,
    }
  );
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const { next_page } = postsResponse;
  const postsPagination: PostPagination = {
    next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
