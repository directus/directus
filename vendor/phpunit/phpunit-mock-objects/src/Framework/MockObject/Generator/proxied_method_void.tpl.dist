
    {modifier} function {reference}{method_name}({arguments_decl}){return_delim}{return_type}
    {
        $arguments = array({arguments_call});
        $count     = func_num_args();

        if ($count > {arguments_count}) {
            $_arguments = func_get_args();

            for ($i = {arguments_count}; $i < $count; $i++) {
                $arguments[] = $_arguments[$i];
            }
        }

        $this->__phpunit_getInvocationMocker()->invoke(
            new PHPUnit_Framework_MockObject_Invocation_Object(
                '{class_name}', '{method_name}', $arguments, '{return_type}', $this, {clone_arguments}
            )
        );

        call_user_func_array(array($this->__phpunit_originalObject, "{method_name}"), $arguments);
    }
