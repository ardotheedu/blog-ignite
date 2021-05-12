import { GetStaticPaths, GetStaticProps } from 'next';

import { format } from 'date-fns';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  let readTime = post.data.content.reduce((acumulador, valorAtual) => {
    const heading = valorAtual.heading?.split(/\s/);
    const text = RichText.asText(valorAtual.body).split(/\s/);

    return acumulador + heading.length + text.length;
  }, 0);

  readTime /= 200;

  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <img src={post.data.banner.url} className={styles.banner} alt="banner" />
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.infoContainer}>
            <div className={styles.info}>
              <FiCalendar size={20} />
              <time>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
            </div>
            <div className={styles.info}>
              <FiUser size={20} />
              <p>{post.data.author}</p>
            </div>
            <div className={styles.info}>
              <FiClock size={20} />
              <p>{Math.ceil(readTime)} min</p>
            </div>
          </div>
          {post.data.content.map(content => (
            <div key={content.heading}>
              <h2>{content.heading}</h2>

              <div className={styles.content}>
                {content.body.map(body => (
                  <p key={body.text}>{body.text}</p>
                ))}
              </div>
            </div>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);
  // //example
  // let data = await getFranchises();

  // // Get the paths we want to pre-render based on posts
  // const paths = data.map(post => ({
  //     params: {id: post.id},
  // }));
  return {
    paths: posts.results.map(post => {
      return {
        params: {
          slug: post.uid,
        },
      };
    }),
    fallback: true,
  };

  // TODO
};

export const getStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('post', String(slug), {});
  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      subtitle: response.data.subtitle,
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body,
        };
      }),
    },
  };
  return {
    props: {
      post,
    },
  };
};
