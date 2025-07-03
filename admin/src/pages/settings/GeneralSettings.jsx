import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { useOutletContext } from 'react-router';
import { useState } from 'react';
import * as Yup from 'yup';
import { Formik } from 'formik';
// import ApiService from 'services/api.service';
import ApiService from '../../services/api.service';

// material-ui
import Button from '@mui/material/Button';

// assets
import { Home3 } from 'iconsax-react';

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
      color: theme.palette.mode === 'dark' ? theme.palette.secondary.main : theme.palette.secondary[100]
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === 'dark' ? 0.3 : 0.7
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





  return <>

    <Card sx={{ '& .MuiInputLabel-root': { fontSize: '0.875rem' } }}>
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
            const response = await ApiService.request({
              method: 'PUT',
              endpoint: '/update-general-settings',
              data: values
            });
            if (!response || response.status !== 200) throw response;
            window.alert('Settings Updated successfully.');
            setStatus({ success: false });
            setSubmitting(false);
          } catch (err) {
            console.log(err);
            window.alert(err?.message || 'Failed to update settings.');
            setStatus({ success: false });
            setErrors({ submit: err?.msg });
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
                  <Button type="submit" style={{ margin: "2px" }} disabled={isSubmitting || Object.keys(errors).length !== 0} loading={isSubmitting} variant="contained" loadingPosition="start" startIcon={<Home3 />}>
                    Save Settings
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </form>
        )}
      </Formik>
    </Card >

  </>

}