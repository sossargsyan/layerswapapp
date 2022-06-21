
import { useRouter } from 'next/router';
import { FC, useCallback, useEffect, useState } from 'react'
import { useAuthDataUpdate, useAuthState } from '../../../../context/auth';
import { useInterval } from '../../../../hooks/useInyterval';
import TokenService from '../../../../lib/TokenService';
import LayerSwapAuthApiClient from '../../../../lib/userAuthApiClient';
import SubmitButton from '../../../buttons/submitButton';

const CodeStep: FC = () => {

    const [code, setCode] = useState("")
    // const { nextStep } = useWizardState();
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const nextTime = TokenService.getCodeNextTime()

    const router = useRouter();
    const { redirect } = router.query;

    const [resendTimeLeft, setResendTimeLeft] = useState(nextTime ? new Date(nextTime).getTime() - new Date().getTime() : 0)

    const { email, authData } = useAuthState();

    const { updateAuthData } = useAuthDataUpdate()
    const handleInputChange = (e) => {
        setCode(e?.target?.value)
    }

    useInterval(() => {
        if (nextTime && new Date(nextTime).getTime() > new Date().getTime())
            setResendTimeLeft(new Date(nextTime).getTime() - new Date().getTime())
        else
            setResendTimeLeft(0)
    }, [nextTime], 1000)

    const verifyCode = useCallback(async () => {
        setLoading(true)
        var apiClient = new LayerSwapAuthApiClient();
        const res = await apiClient.connectAsync(email, code)
        await updateAuthData(res)
        console.log(res)
        await router.push(redirect?.toString() || '/')
        setLoading(false)
    }, [email, code, redirect])

    const handleResendCode = useCallback(async () => {
        try {
            const apiClient = new LayerSwapAuthApiClient();
            const res = await apiClient.getCodeAsync(email)
        }
        catch (e) {
            setError(e.message)
            console.log(e)
        }
        finally {
            setLoading(false)
        }
    }, [email])

    return (
        <>
            <div className="w-full px-3 md:px-6 md:px-12 py-12 grid grid-flow-row">
                <div>
                    <label htmlFor="amount" className="block font-normal text-light-blue text-sm">
                        Your Email Code
                    </label>
                    <div className="relative rounded-md shadow-sm mt-2 mb-4">
                        <input
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder="XXXXXX"
                            autoCorrect="off"
                            type="text"
                            maxLength={6}
                            name="Code"
                            id="Code"
                            className="h-12 text-2xl pl-5 focus:ring-pink-primary text-center focus:border-pink-primary border-darkblue-100 block
                            placeholder:text-light-blue placeholder:text-2xl placeholder:h-12 placeholder:text-center tracking-widest placeholder:font-normal placeholder:opacity-50 bg-darkblue-600 border-gray-600 w-full font-semibold rounded-md placeholder-gray-400"
                            onKeyPress={e => {
                                isNaN(Number(e.key)) && e.preventDefault()
                            }}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
                <div className="text-white text-sm mt-auto mb-4 mt-4">
                    <SubmitButton isDisabled={code?.length != 6 || loading} icon="" isSubmitting={loading} onClick={verifyCode}>
                        Confirm
                    </SubmitButton>
                </div>
                <div className="flex items-center">
                    <label className="block text-base font-lighter leading-6 text-light-blue"> Did not receive the verification?
                        <button onClick={handleResendCode}>
                            <a className="font-lighter text-darkblue underline hover:cursor-pointer">Resend again</a>
                        </button>
                    </label>
                </div>
            </div>

        </>
    )
}

export default CodeStep;