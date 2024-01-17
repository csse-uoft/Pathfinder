import React from 'react';

import OrganizationView from "./OrganizationView";
import {useParams} from "react-router-dom";

export default function Organization() {
  const {uri, viewMode} = useParams();
  return <OrganizationView  single uri={uri}/>
}