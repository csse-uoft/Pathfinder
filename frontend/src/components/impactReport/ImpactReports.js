import React from 'react';


import ImpactReportView from "./ImpactReportView";
import {useParams} from "react-router-dom";
export default function ImpactReports() {

  const {uri} = useParams();
  return <ImpactReportView multi organizationUri={uri}/>

}