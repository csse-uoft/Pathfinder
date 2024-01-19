import React from 'react';

import IndicatorReportView from "./IndicatorReportView";
import {useParams} from "react-router-dom";

export default function IndicatorReports() {
  const {uri} = useParams();
  return <IndicatorReportView multi organizationUri={uri}/>

}
