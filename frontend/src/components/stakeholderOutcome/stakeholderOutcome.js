import React from 'react';

import {useParams} from "react-router-dom";

import StakeholderOutcomeView from "./StakeholderOutcomeView";
export default function StakeholderOutcome() {

  const {uri} = useParams();
  return <StakeholderOutcomeView single/>

}