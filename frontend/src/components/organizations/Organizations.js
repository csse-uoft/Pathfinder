import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import { useSnackbar } from 'notistack';
import {deleteOrganization} from "../../api/organizationApi";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {useNavigate} from "react-router-dom";
import {fetchDataTypes} from "../../api/generalAPI";
import OrganizationView from "./OrganizationView";

export default function Organizations() {
  return <OrganizationView organizationUser multi/>
}
