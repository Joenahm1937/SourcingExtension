import { IPageData } from '../interfaces';
import { PageCard } from './PageCard';

export const PageList = ({ pages }: { pages: IPageData[] }) => (
    <ul className="pages">
        {pages.map((pageData) => (
            <PageCard key={pageData.profile} {...pageData} />
        ))}
    </ul>
);
