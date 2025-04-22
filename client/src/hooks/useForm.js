import { useState, useCallback } from 'react';
import { validateForm } from '../utils/validators';

/**
 * Custom hook for form handling with validation
 * @param {object} initialValues - Initial form values
 * @param {object} validationRules - Validation rules for form fields
 * @param {function} onSubmit - Function to call on form submission
 * @returns {object} Form state and handlers
 */
const useForm = (initialValues = {}, validationRules = {}, onSubmit = () => {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    
    setValues((prevValues) => ({
      ...prevValues,
      [name]: inputValue,
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: undefined,
      }));
    }
  }, [errors]);

  // Handle custom value change (for non-input elements)
  const setFieldValue = useCallback((name, value) => {
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: undefined,
      }));
    }
  }, [errors]);

  // Handle input blur (for validation on blur)
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    setTouched((prevTouched) => ({
      ...prevTouched,
      [name]: true,
    }));
    
    // Validate single field
    if (validationRules[name]) {
      const fieldErrors = validateForm(
        { [name]: values[name] },
        { [name]: validationRules[name] }
      );
      
      setErrors((prevErrors) => ({
        ...prevErrors,
        ...fieldErrors,
      }));
    }
  }, [values, validationRules]);

  // Mark field as touched
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched((prevTouched) => ({
      ...prevTouched,
      [name]: isTouched,
    }));
    
    // Validate single field
    if (validationRules[name]) {
      const fieldErrors = validateForm(
        { [name]: values[name] },
        { [name]: validationRules[name] }
      );
      
      setErrors((prevErrors) => ({
        ...prevErrors,
        ...fieldErrors,
      }));
    }
  }, [values, validationRules]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitError(null);
  }, [initialValues]);

  // Validate all form fields
  const validateAllFields = useCallback(() => {
    const formErrors = validateForm(values, validationRules);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, [values, validationRules]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce(
      (acc, field) => ({ ...acc, [field]: true }),
      {}
    );
    setTouched(allTouched);
    
    // Validate all fields
    const isValid = validateAllFields();
    
    if (isValid) {
      setIsSubmitting(true);
      setSubmitError(null);
      
      try {
        await onSubmit(values);
      } catch (error) {
        setSubmitError(error.message || 'Form submission failed');
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validationRules, validateAllFields, onSubmit]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
    resetForm,
    validateAllFields,
  };
};

export default useForm;
