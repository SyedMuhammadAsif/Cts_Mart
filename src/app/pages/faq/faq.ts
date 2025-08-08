import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.html',
  styleUrl: './faq.css'
})
export class FAQ implements OnInit {
  activeIndex: number | null = null;

  faqs = [
    {
      category: 'Orders & Shipping',
      questions: [
        {
          question: 'How can I track my order?',
          answer: 'You can track your order by visiting the "Orders" section in your account or by clicking the tracking link sent to your email after purchase.'
        },
        {
          question: 'What are the shipping charges?',
          answer: 'Shipping charges vary based on location and order value. Orders above ₹500 qualify for free shipping. You can view exact charges at checkout.'
        },
        {
          question: 'How long does delivery take?',
          answer: 'Standard delivery takes 3-7 business days. Express delivery (available in select cities) takes 1-2 business days.'
        }
      ]
    },
    {
      category: 'Returns & Refunds',
      questions: [
        {
          question: 'What is your return policy?',
          answer: 'We offer a 30-day return policy for most items. Products must be unused, in original packaging, and accompanied by the original receipt.'
        },
        {
          question: 'How do I initiate a return?',
          answer: 'Go to "My Orders", select the item you want to return, and click "Return Item". Follow the instructions to schedule a pickup.'
        },
        {
          question: 'When will I receive my refund?',
          answer: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item.'
        }
      ]
    },
    {
      category: 'Account & Payment',
      questions: [
        {
          question: 'How do I create an account?',
          answer: 'Click on "Signup/Login" in the top navigation, then select "Create Account" and fill in your details.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept credit/debit cards, UPI, net banking, and cash on delivery (COD) for eligible orders.'
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Yes, we use industry-standard SSL encryption and secure payment gateways to protect your financial information.'
        }
      ]
    },
    {
      category: 'Products & Pricing',
      questions: [
        {
          question: 'Are the product images accurate?',
          answer: 'We strive to display accurate product images. However, slight variations in color may occur due to monitor settings.'
        },
        {
          question: 'Do you offer price matching?',
          answer: 'We regularly update our prices to stay competitive. While we don\'t offer formal price matching, we ensure our prices are among the best.'
        },
        {
          question: 'How can I check product availability?',
          answer: 'Product availability is shown on each product page. If an item is out of stock, you can enable notifications to be alerted when it\'s back.'
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.scrollToTop();
  }

  toggleAccordion(categoryIndex: number, questionIndex: number): void {
    const index = categoryIndex * 1000 + questionIndex; // Create unique index
    this.activeIndex = this.activeIndex === index ? null : index;
  }

  isActive(categoryIndex: number, questionIndex: number): boolean {
    const index = categoryIndex * 1000 + questionIndex;
    return this.activeIndex === index;
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
} 