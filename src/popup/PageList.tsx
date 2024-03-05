import { IPageData } from '../interfaces';
import PageCard from './PageCard';

const PageList = ({ pages }: { pages: IPageData[] }) => (
    <ul className="pages">
        {pages.map((pageData) => (
            <PageCard key={pageData.profile} {...pageData} />
        ))}
    </ul>
);

export default PageList;
