import { IPageData } from '../interfaces';

export const PageCard = ({ profile }: IPageData) => (
    <li className="page-card">
        <div>{profile}</div>
    </li>
);
