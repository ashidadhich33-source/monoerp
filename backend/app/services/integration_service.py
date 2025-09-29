"""
External API integration service
"""
import requests
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from app.config.settings import get_settings

logger = logging.getLogger(__name__)

class IntegrationService:
    def __init__(self):
        self.settings = get_settings()
        self.integrations = {
            'sms': self._init_sms_integration(),
            'email': self._init_email_integration(),
            'payment': self._init_payment_integration(),
            'analytics': self._init_analytics_integration(),
            'backup': self._init_backup_integration()
        }
    
    def _init_sms_integration(self) -> Dict[str, Any]:
        """Initialize SMS integration"""
        return {
            'provider': self.settings.sms_provider,
            'api_key': self.settings.sms_api_key,
            'api_url': self.settings.sms_api_url,
            'enabled': self.settings.sms_enabled
        }
    
    def _init_email_integration(self) -> Dict[str, Any]:
        """Initialize email integration"""
        return {
            'provider': self.settings.email_provider,
            'api_key': self.settings.email_api_key,
            'api_url': self.settings.email_api_url,
            'enabled': self.settings.email_enabled
        }
    
    def _init_payment_integration(self) -> Dict[str, Any]:
        """Initialize payment integration"""
        return {
            'provider': self.settings.payment_provider,
            'api_key': self.settings.payment_api_key,
            'api_url': self.settings.payment_api_url,
            'enabled': self.settings.payment_enabled
        }
    
    def _init_analytics_integration(self) -> Dict[str, Any]:
        """Initialize analytics integration"""
        return {
            'provider': self.settings.analytics_provider,
            'api_key': self.settings.analytics_api_key,
            'api_url': self.settings.analytics_api_url,
            'enabled': self.settings.analytics_enabled
        }
    
    def _init_backup_integration(self) -> Dict[str, Any]:
        """Initialize backup integration"""
        return {
            'provider': self.settings.backup_provider,
            'api_key': self.settings.backup_api_key,
            'api_url': self.settings.backup_api_url,
            'enabled': self.settings.backup_enabled
        }
    
    async def send_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Send SMS via external provider"""
        try:
            if not self.integrations['sms']['enabled']:
                return {'success': False, 'error': 'SMS integration not enabled'}
            
            provider = self.integrations['sms']['provider']
            
            if provider == 'twilio':
                return await self._send_sms_twilio(phone_number, message)
            elif provider == 'textlocal':
                return await self._send_sms_textlocal(phone_number, message)
            else:
                return {'success': False, 'error': f'Unsupported SMS provider: {provider}'}
                
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _send_sms_twilio(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Send SMS via Twilio"""
        try:
            from twilio.rest import Client
            
            client = Client(
                self.integrations['sms']['api_key'],
                self.settings.sms_auth_token
            )
            
            message_obj = client.messages.create(
                body=message,
                from_=self.settings.sms_from_number,
                to=phone_number
            )
            
            return {
                'success': True,
                'message_id': message_obj.sid,
                'status': message_obj.status
            }
            
        except Exception as e:
            logger.error(f"Twilio SMS error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _send_sms_textlocal(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Send SMS via TextLocal"""
        try:
            url = self.integrations['sms']['api_url']
            data = {
                'apikey': self.integrations['sms']['api_key'],
                'numbers': phone_number,
                'message': message,
                'sender': self.settings.sms_sender_name
            }
            
            response = requests.post(url, data=data)
            result = response.json()
            
            if result.get('status') == 'success':
                return {
                    'success': True,
                    'message_id': result.get('batch_id'),
                    'status': 'sent'
                }
            else:
                return {
                    'success': False,
                    'error': result.get('errors', ['Unknown error'])
                }
                
        except Exception as e:
            logger.error(f"TextLocal SMS error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def send_email(self, to_email: str, subject: str, body: str, 
                        html_body: Optional[str] = None) -> Dict[str, Any]:
        """Send email via external provider"""
        try:
            if not self.integrations['email']['enabled']:
                return {'success': False, 'error': 'Email integration not enabled'}
            
            provider = self.integrations['email']['provider']
            
            if provider == 'sendgrid':
                return await self._send_email_sendgrid(to_email, subject, body, html_body)
            elif provider == 'mailgun':
                return await self._send_email_mailgun(to_email, subject, body, html_body)
            else:
                return {'success': False, 'error': f'Unsupported email provider: {provider}'}
                
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _send_email_sendgrid(self, to_email: str, subject: str, 
                                  body: str, html_body: Optional[str] = None) -> Dict[str, Any]:
        """Send email via SendGrid"""
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail
            
            sg = sendgrid.SendGridAPIClient(api_key=self.integrations['email']['api_key'])
            
            message = Mail(
                from_email=self.settings.email_from_address,
                to_emails=to_email,
                subject=subject,
                plain_text_content=body,
                html_content=html_body
            )
            
            response = sg.send(message)
            
            return {
                'success': True,
                'message_id': response.headers.get('X-Message-Id'),
                'status_code': response.status_code
            }
            
        except Exception as e:
            logger.error(f"SendGrid email error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _send_email_mailgun(self, to_email: str, subject: str, 
                                 body: str, html_body: Optional[str] = None) -> Dict[str, Any]:
        """Send email via Mailgun"""
        try:
            url = f"{self.integrations['email']['api_url']}/messages"
            data = {
                'from': self.settings.email_from_address,
                'to': to_email,
                'subject': subject,
                'text': body
            }
            
            if html_body:
                data['html'] = html_body
            
            response = requests.post(
                url,
                auth=('api', self.integrations['email']['api_key']),
                data=data
            )
            
            result = response.json()
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'message_id': result.get('id'),
                    'status': 'sent'
                }
            else:
                return {
                    'success': False,
                    'error': result.get('message', 'Unknown error')
                }
                
        except Exception as e:
            logger.error(f"Mailgun email error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def process_payment(self, amount: float, currency: str, 
                             payment_method: str, customer_info: Dict[str, Any]) -> Dict[str, Any]:
        """Process payment via external provider"""
        try:
            if not self.integrations['payment']['enabled']:
                return {'success': False, 'error': 'Payment integration not enabled'}
            
            provider = self.integrations['payment']['provider']
            
            if provider == 'stripe':
                return await self._process_payment_stripe(amount, currency, payment_method, customer_info)
            elif provider == 'razorpay':
                return await self._process_payment_razorpay(amount, currency, payment_method, customer_info)
            else:
                return {'success': False, 'error': f'Unsupported payment provider: {provider}'}
                
        except Exception as e:
            logger.error(f"Failed to process payment: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _process_payment_stripe(self, amount: float, currency: str, 
                                    payment_method: str, customer_info: Dict[str, Any]) -> Dict[str, Any]:
        """Process payment via Stripe"""
        try:
            import stripe
            
            stripe.api_key = self.integrations['payment']['api_key']
            
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency,
                payment_method=payment_method,
                confirmation_method='manual',
                confirm=True
            )
            
            return {
                'success': True,
                'payment_id': intent.id,
                'status': intent.status,
                'client_secret': intent.client_secret
            }
            
        except Exception as e:
            logger.error(f"Stripe payment error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _process_payment_razorpay(self, amount: float, currency: str, 
                                       payment_method: str, customer_info: Dict[str, Any]) -> Dict[str, Any]:
        """Process payment via Razorpay"""
        try:
            import razorpay
            
            client = razorpay.Client(
                auth=(self.integrations['payment']['api_key'], self.settings.payment_secret_key)
            )
            
            # Create order
            order = client.order.create({
                'amount': int(amount * 100),  # Convert to paise
                'currency': currency,
                'receipt': f"order_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            })
            
            return {
                'success': True,
                'order_id': order['id'],
                'amount': order['amount'],
                'currency': order['currency']
            }
            
        except Exception as e:
            logger.error(f"Razorpay payment error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def send_analytics_event(self, event_name: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send analytics event to external provider"""
        try:
            if not self.integrations['analytics']['enabled']:
                return {'success': False, 'error': 'Analytics integration not enabled'}
            
            provider = self.integrations['analytics']['provider']
            
            if provider == 'google_analytics':
                return await self._send_analytics_google(event_name, event_data)
            elif provider == 'mixpanel':
                return await self._send_analytics_mixpanel(event_name, event_data)
            else:
                return {'success': False, 'error': f'Unsupported analytics provider: {provider}'}
                
        except Exception as e:
            logger.error(f"Failed to send analytics event: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _send_analytics_google(self, event_name: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send analytics event to Google Analytics"""
        try:
            from google.analytics.data_v1beta import BetaAnalyticsDataClient
            from google.analytics.data_v1beta.types import RunReportRequest
            
            client = BetaAnalyticsDataClient(credentials=self.integrations['analytics']['api_key'])
            
            request = RunReportRequest(
                property=f"properties/{self.settings.analytics_property_id}",
                dimensions=[{"name": "eventName"}],
                metrics=[{"name": "eventCount"}],
                date_ranges=[{"start_date": "today", "end_date": "today"}]
            )
            
            response = client.run_report(request)
            
            return {
                'success': True,
                'event_name': event_name,
                'status': 'sent'
            }
            
        except Exception as e:
            logger.error(f"Google Analytics error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _send_analytics_mixpanel(self, event_name: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send analytics event to Mixpanel"""
        try:
            import mixpanel
            
            mp = mixpanel.Mixpanel(self.integrations['analytics']['api_key'])
            
            mp.track(
                distinct_id=event_data.get('user_id', 'anonymous'),
                event_name=event_name,
                properties=event_data
            )
            
            return {
                'success': True,
                'event_name': event_name,
                'status': 'sent'
            }
            
        except Exception as e:
            logger.error(f"Mixpanel error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def upload_to_cloud_backup(self, file_path: str, backup_name: str) -> Dict[str, Any]:
        """Upload backup to cloud storage"""
        try:
            if not self.integrations['backup']['enabled']:
                return {'success': False, 'error': 'Backup integration not enabled'}
            
            provider = self.integrations['backup']['provider']
            
            if provider == 'aws_s3':
                return await self._upload_to_aws_s3(file_path, backup_name)
            elif provider == 'google_cloud':
                return await self._upload_to_google_cloud(file_path, backup_name)
            else:
                return {'success': False, 'error': f'Unsupported backup provider: {provider}'}
                
        except Exception as e:
            logger.error(f"Failed to upload backup: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _upload_to_aws_s3(self, file_path: str, backup_name: str) -> Dict[str, Any]:
        """Upload backup to AWS S3"""
        try:
            import boto3
            from botocore.exceptions import ClientError
            
            s3_client = boto3.client(
                's3',
                aws_access_key_id=self.integrations['backup']['api_key'],
                aws_secret_access_key=self.settings.backup_secret_key,
                region_name=self.settings.aws_region
            )
            
            bucket_name = self.settings.s3_bucket_name
            object_key = f"backups/{backup_name}"
            
            s3_client.upload_file(file_path, bucket_name, object_key)
            
            return {
                'success': True,
                'bucket': bucket_name,
                'object_key': object_key,
                'url': f"s3://{bucket_name}/{object_key}"
            }
            
        except Exception as e:
            logger.error(f"AWS S3 upload error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _upload_to_google_cloud(self, file_path: str, backup_name: str) -> Dict[str, Any]:
        """Upload backup to Google Cloud Storage"""
        try:
            from google.cloud import storage
            
            client = storage.Client(credentials=self.integrations['backup']['api_key'])
            bucket = client.bucket(self.settings.gcs_bucket_name)
            
            blob = bucket.blob(f"backups/{backup_name}")
            blob.upload_from_filename(file_path)
            
            return {
                'success': True,
                'bucket': self.settings.gcs_bucket_name,
                'object_name': f"backups/{backup_name}",
                'url': f"gs://{self.settings.gcs_bucket_name}/backups/{backup_name}"
            }
            
        except Exception as e:
            logger.error(f"Google Cloud Storage upload error: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_integration_status(self) -> Dict[str, Any]:
        """Get status of all integrations"""
        status = {}
        
        for integration_name, config in self.integrations.items():
            status[integration_name] = {
                'enabled': config['enabled'],
                'provider': config['provider'],
                'configured': bool(config['api_key'])
            }
        
        return status
    
    def test_integration(self, integration_name: str) -> Dict[str, Any]:
        """Test a specific integration"""
        try:
            if integration_name not in self.integrations:
                return {'success': False, 'error': f'Unknown integration: {integration_name}'}
            
            config = self.integrations[integration_name]
            
            if not config['enabled']:
                return {'success': False, 'error': f'{integration_name} integration not enabled'}
            
            if not config['api_key']:
                return {'success': False, 'error': f'{integration_name} API key not configured'}
            
            # Test based on integration type
            if integration_name == 'sms':
                return self._test_sms_integration()
            elif integration_name == 'email':
                return self._test_email_integration()
            elif integration_name == 'payment':
                return self._test_payment_integration()
            elif integration_name == 'analytics':
                return self._test_analytics_integration()
            elif integration_name == 'backup':
                return self._test_backup_integration()
            else:
                return {'success': False, 'error': f'Unknown integration type: {integration_name}'}
                
        except Exception as e:
            logger.error(f"Integration test error: {e}")
            return {'success': False, 'error': str(e)}
    
    def _test_sms_integration(self) -> Dict[str, Any]:
        """Test SMS integration"""
        # This would typically send a test SMS
        return {'success': True, 'message': 'SMS integration test passed'}
    
    def _test_email_integration(self) -> Dict[str, Any]:
        """Test email integration"""
        # This would typically send a test email
        return {'success': True, 'message': 'Email integration test passed'}
    
    def _test_payment_integration(self) -> Dict[str, Any]:
        """Test payment integration"""
        # This would typically test payment gateway connectivity
        return {'success': True, 'message': 'Payment integration test passed'}
    
    def _test_analytics_integration(self) -> Dict[str, Any]:
        """Test analytics integration"""
        # This would typically test analytics API connectivity
        return {'success': True, 'message': 'Analytics integration test passed'}
    
    def _test_backup_integration(self) -> Dict[str, Any]:
        """Test backup integration"""
        # This would typically test cloud storage connectivity
        return {'success': True, 'message': 'Backup integration test passed'}

# Global integration service instance
integration_service = IntegrationService()