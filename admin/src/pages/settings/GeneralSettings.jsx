// import CommonDatatable from 'helpers/CommonDatatable'
// import { useMemo } from 'react';

// export default function ROI() {

//   const apiPoint = 'get-all-incomes'

//   const columns = useMemo(
//     () => [
//       {
//         header: 'User ID',
//         accessorKey: 'user_id'
//       },
//       {
//         header: 'Matched Amount',
//         accessorKey: 'extra.matchedAMT'
//       },
//       {
//         header: 'Level',
//         accessorKey: 'extra.level'
//       },
//       {
//         header: 'Amount',
//         accessorKey: 'amount'
//       },
//       {
//         header: 'Date',
//         accessorKey: 'created_at',
//         // meta: { className: 'cell-right' }
//         cell: (props) => {
//           return new Date(props.getValue()).toLocaleString();
//         },
//         enableColumnFilter: false,
//         enableGrouping: false
//       }
//     ],
//     []
//   );

//   return <CommonDatatable columns={columns} apiPoint={apiPoint} type={3} />
// }



import { FormControlLabel, FormGroup, Switch } from "@mui/material";
import { styled } from '@mui/material/styles';
import { ThemeMode } from 'config';

import { useOutletContext } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import InputLabel from '@mui/material/InputLabel';
import Autocomplete from '@mui/material/Autocomplete';
import FormHelperText from '@mui/material/FormHelperText';
import Select from '@mui/material/Select';

import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// third-party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project-imports
import MainCard from 'components/MainCard';
import countries from 'data/countries';
import { openSnackbar } from 'api/snackbar';

// assets
import { Add, Home3 } from 'iconsax-react';
import axios from 'utils/axios';
import { useContext, useEffect, useState } from 'react';
import LoadingButton from 'components/@extended/LoadingButton';
import axiosServices from "utils/axios";

// styles & constant
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = { PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP } } };

function useInputRef() {
  return useOutletContext();
}

const IOSSwitch = styled((props) => <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />)(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.success.main,
        opacity: 1,
        border: 0
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5
      }
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '6px solid #fff'
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.mode === ThemeMode.DARK ? theme.palette.secondary.main : theme.palette.secondary[100]
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === ThemeMode.DARK ? 0.3 : 0.7
    }
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.secondary.light,
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500
    })
  }
}));
IOSSwitch.displayName = 'IOSSwitch';

export default function GeneralSettings() {

  const [settings, setSettings] = useState()

  const inputRef = useInputRef();



  // useEffect(() => {
  //   (async () => {
  //     const res = await axiosServices.get("get-all-settings")
  //     if (res.status === 200) {
  //       setSettings(res?.data?.result[3])
  //     }
  //     else
  //       setSettings([])
  //   })()
  // }, [])

  return <>

    <MainCard content={false} sx={{ '& .MuiInputLabel-root': { fontSize: '0.875rem' } }}>
      <Formik
        initialValues={{
          key: settings?.value || '',
          levels: settings?.extra?.levels?.toString()
        }}

        enableReinitialize={true}
        validationSchema={Yup.object().shape({
          key: Yup.string(),
          levels: Yup.string()
        })}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {

          try {
            const response = await axios.put('/update-general-settings', values)
            if (response.status !== 200) throw response.data
            openSnackbar({
              open: true,
              message: 'Settings Updated successfully.',
              variant: 'alert',
              alert: { color: 'success' }
            })
            setStatus({ success: false })
            setSubmitting(false)
          } catch (err) {
            console.log(err)
            openSnackbar({
              open: true,
              message: err?.message,
              variant: 'alert',
              alert: { color: 'error' }
            })
            setStatus({ success: false });
            setErrors({ submit: err.msg });
            setSubmitting(false);
          }
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, setFieldValue, touched, values }) => (
          
          <form noValidate onSubmit={handleSubmit}>
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={12}>
                  <Stack spacing={1}>
                    <InputLabel htmlFor="Key">Private Key</InputLabel>
                    <TextField
                      fullWidth
                      id="key"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder=""
                      autoFocus
                      inputRef={inputRef}
                    />
                  </Stack>
                  {touched.key && errors.key && (
                    <FormHelperText error id="key">
                      {errors.key}
                    </FormHelperText>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LoadingButton type="submit" style={{ margin: "2px" }} disabled={isSubmitting || Object.keys(errors).length !== 0} loading={isSubmitting} variant="contained" loadingPosition="start" startIcon={<Home3 />}>
                    Save Settings
                  </LoadingButton>
                </Grid>
              </Grid>
            </Box>
          </form>
        )}
      </Formik>
    </MainCard >

  </>

}